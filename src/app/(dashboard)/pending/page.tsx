import { SignOutButton } from "@/components/sign-out-button";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="card max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
          <svg className="h-8 w-8 text-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-espresso">
          Account Pending Approval
        </h1>
        <p className="mt-2 text-sm text-espresso/60">
          Thank you for registering! Your cafe account is waiting for approval from our
          team. You&apos;ll receive an email once your account is activated — usually within
          24 hours.
        </p>
        <p className="mt-3 text-xs text-espresso/40">
          If you have questions, contact support.
        </p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
