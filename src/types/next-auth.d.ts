import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: string;
      orgName: string;
      orgSlug: string;
      role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "STAFF";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    orgId: string;
    orgName: string;
    orgSlug: string;
    role: "SUPER_ADMIN" | "OWNER" | "MANAGER" | "STAFF";
  }
}
