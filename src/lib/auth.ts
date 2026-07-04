import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { memberships: { include: { organization: true } } },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        const membership = user.memberships[0];
        if (!membership) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          orgId: membership.organizationId,
          orgName: membership.organization.name,
          orgSlug: membership.organization.slug,
          role: membership.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.orgId = (user as { orgId?: string }).orgId ?? "";
        token.orgName = (user as { orgName?: string }).orgName ?? "";
        token.orgSlug = (user as { orgSlug?: string }).orgSlug ?? "";
        token.role = (user as { role?: "OWNER" | "MANAGER" | "STAFF" }).role ?? "STAFF";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.orgId = token.orgId;
        session.user.orgName = token.orgName;
        session.user.orgSlug = token.orgSlug;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}

/** Throws-free helper: returns the current session's org context, or null. */
export async function getCurrentOrgContext() {
  const session = await getAuthSession();
  if (!session?.user) return null;
  return {
    userId: session.user.id,
    orgId: session.user.orgId,
    orgName: session.user.orgName,
    orgSlug: session.user.orgSlug,
    role: session.user.role,
  };
}
