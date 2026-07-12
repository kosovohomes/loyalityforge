import { SignOutButton } from "@/components/sign-out-button";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="card max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-clay/20">
          <svg className="h-8 w-8 text-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-espresso">
          Account Suspended
        </h1>
        <p className="mt-2 text-sm text-espresso/60">
          Your cafe account has been suspended. Please contact support if you believe this
          is an error or to resolve the issue.
        </p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
