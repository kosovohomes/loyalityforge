import Link from "next/link";
import { AuthSessionProvider } from "@/components/session-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <div className="min-h-screen bg-cream">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-espresso text-cream font-display text-lg">
              L
            </span>
            <span className="font-display text-xl font-semibold text-espresso">LoyaltyForge</span>
          </Link>
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
