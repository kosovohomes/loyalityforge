"use client";

import Link from "next/link";
import { useState } from "react";
import { submitSupportTicket } from "@/lib/actions-support";

export default function SupportPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const result = await submitSupportTicket({
        name: form.name,
        email: form.email,
        subject: form.subject,
        category: form.category,
        message: form.message,
      });

      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setSubmittedEmail(form.email);
        setStatus("success");
        setForm({ name: "", email: "", subject: "", category: "general", message: "" });
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-espresso/10 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-espresso text-cream font-display text-lg font-bold">L</span>
            <span className="font-display text-xl font-semibold text-espresso">LoyaltyForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-espresso md:text-4xl">Contact Support</h1>
        <p className="mt-3 text-espresso/60">
          Have a question, issue, or feature request? We&apos;d love to hear from you.
          Fill out the form below and we&apos;ll get back to you within 24 hours.
        </p>

        {status === "success" && (
          <div className="mt-6 rounded-lg border border-pine/30 bg-pine/10 p-4 text-sm text-pine-dark">
            <strong>Message sent!</strong> We&apos;ll get back to you at {submittedEmail || "your email"} within 24 hours.
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 rounded-lg border border-clay/30 bg-clay/10 p-4 text-sm text-clay">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="label">Name</label>
              <input
                id="name"
                type="text"
                required
                className="input mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input mt-1"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="label">Category</label>
            <select
              id="category"
              className="input mt-1"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="general">General Question</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="billing">Billing</option>
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="label">Subject</label>
            <input
              id="subject"
              type="text"
              required
              className="input mt-1"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="What is this about?"
            />
          </div>

          <div>
            <label htmlFor="message" className="label">Message</label>
            <textarea
              id="message"
              required
              rows={6}
              className="input mt-1 resize-y"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us more..."
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn-gold w-full px-6 py-3 text-base"
          >
            {status === "submitting" ? "Sending..." : "Send Message"}
          </button>
        </form>

        <div className="mt-12 border-t border-espresso/10 pt-8">
          <h2 className="font-display text-lg font-semibold text-espresso">Other Ways to Reach Us</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="card">
              <h3 className="font-semibold text-espresso">API Documentation</h3>
              <p className="mt-1 text-sm text-espresso/60">
                Check out the API reference for integration help.
              </p>
              <Link href="/settings/api-keys" className="mt-2 inline-block text-sm font-medium text-gold-dark hover:underline">
                View API Docs &rarr;
              </Link>
            </div>
            <div className="card">
              <h3 className="font-semibold text-espresso">Community</h3>
              <p className="mt-1 text-sm text-espresso/60">
                Join the discussion on GitHub.
              </p>
              <a
                href="https://github.com/jeepooly-blip/loyaltyforge"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-gold-dark hover:underline"
              >
                GitHub &rarr;
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
