"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Stories", href: "#testimonials" },
];

const BRANDS = [
  "Sunrise Coffee",
  "Bean & Brew",
  "The Daily Grind",
  "Roast Republic",
  "Cuppa Joy",
  "Grounded Co.",
];

const STEPS = [
  {
    num: "01",
    title: "Create Your Program",
    desc: "Choose from stamp cards, points programs, or tiered VIP memberships. Set your rules, name your rewards, and preview everything before you publish.",
  },
  {
    num: "02",
    title: "Customers Join",
    desc: "Share a unique QR code in-store, embed a widget on your website, or connect via API. Signing up takes seconds — no app download required.",
  },
  {
    num: "03",
    title: "Watch Loyalty Grow",
    desc: "Track visits, redemptions, and lifetime value in real time. Automated nudges bring customers back before they forget you exist.",
  },
];

const FEATURES = [
  {
    icon: "\u{1F4CB}",
    title: "Stamp Cards",
    desc: "The classic punch card, digitized. Customers collect stamps with every purchase and redeem rewards at thresholds you set.",
  },
  {
    icon: "\u{1F4B0}",
    title: "Points Economy",
    desc: "Earn points per dollar spent. Let customers redeem for discounts, freebies, or exclusive items — fully configurable.",
  },
  {
    icon: "\u{1F3C6}",
    title: "Tiered VIP",
    desc: "Bronze, Silver, Gold — reward your biggest spenders with escalating perks. Tiers unlock automatically based on activity.",
  },
  {
    icon: "\u{1F3AF}",
    title: "Challenges & Milestones",
    desc: "Gamify the experience. Set challenges like \u201CVisit 5 days in a row\u201D and unlock milestone badges that keep customers engaged.",
  },
  {
    icon: "\u{1F381}",
    title: "Rewards Catalog",
    desc: "Coupons, free items, experiential rewards, or even charity donations. Build a catalog your customers actually want.",
  },
  {
    icon: "\u{1F3B2}",
    title: "Scratch & Win",
    desc: "Interactive digital scratch cards after every purchase. Instant gratification that drives repeat visits and social sharing.",
  },
];

const STATS = [
  { value: "15-30%", label: "more repeat visits", desc: "Loyalty members visit significantly more often than non-members." },
  { value: "2x", label: "purchase frequency", desc: "Rewards programs double how often customers come back." },
  { value: "48%", label: "higher CLV", desc: "Customer lifetime value jumps nearly 50% with a well-run program." },
  { value: "3x", label: "return on investment", desc: "For every dollar you spend, loyalty programs return three." },
];

const INTEGRATIONS = [
  "Shopify",
  "Square",
  "Lightspeed",
  "Stripe",
  "Mailchimp",
  "Klaviyo",
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    desc: "Perfect for testing the waters",
    features: [
      "Up to 100 members",
      "1 active program",
      "Stamp card or points",
      "QR code sign-up",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/mo",
    desc: "For cafes ready to scale loyalty",
    features: [
      "Up to 5,000 members",
      "Unlimited programs",
      "All program types",
      "Embeddable widget",
      "Advanced analytics",
      "API access",
      "Priority support",
      "Custom branding",
    ],
    cta: "Start Growing",
    popular: true,
  },
  {
    name: "Scale",
    price: "$99",
    period: "/mo",
    desc: "For multi-location operations",
    features: [
      "Unlimited members",
      "Everything in Growth",
      "Multi-location support",
      "Dedicated account manager",
      "Custom integrations",
      "White-label option",
      "SLA guarantee",
      "Phone support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "We launched LoyaltyForge on a Monday. By Friday we had 200 members. Three months later, our repeat customer rate jumped 28%. It\u2019s the best investment we\u2019ve made.",
    name: "Maria Chen",
    business: "Sunrise Coffee, Portland",
  },
  {
    quote: "Our old paper stamp cards kept getting lost. LoyaltyForge digitized the whole experience and our customers love checking their progress on their phones.",
    name: "James O\u2019Brien",
    business: "The Daily Grind, Dublin",
  },
  {
    quote: "The tiered VIP program changed everything. Our Gold members now spend 3x more per visit. The gamification aspect keeps people competing for status.",
    name: "Aisha Patel",
    business: "Cuppa Joy, London",
  },
];

const FAQS = [
  {
    q: "How does LoyaltyForge work?",
    a: "LoyaltyForge lets you create a digital loyalty program in minutes. Choose a template (stamp card, points, or tiered), set your rules, and share it with customers via QR code, website widget, or API. Customers earn rewards automatically with every purchase.",
  },
  {
    q: "How much does it cost?",
    a: "We offer a free Starter plan for up to 100 members with no time limit. Growth ($29/mo) unlocks advanced features for growing cafes, and Scale ($99/mo) supports multi-location operations with unlimited members.",
  },
  {
    q: "How long does setup take?",
    a: "Most cafe owners have their program live within 15 minutes. You pick a template, customize the name and rewards, generate your QR code, and you\u2019re ready to go. No developer needed.",
  },
  {
    q: "Does it integrate with my POS?",
    a: "Yes. We have native integrations with Shopify, Square, and Lightspeed. We also provide a REST API and embeddable widget so you can connect LoyaltyForge to virtually any system.",
  },
  {
    q: "Is there an API?",
    a: "Absolutely. Our REST API lets you enroll customers, award points, process redemptions, and check balances from any POS, website, or mobile app. Full documentation is included with every Growth plan and above.",
  },
  {
    q: "What kind of support do you offer?",
    a: "Starter plans include email support with a 24-hour response time. Growth plans get priority support. Scale plans include a dedicated account manager and phone support with an SLA guarantee.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 border-b border-espresso/10 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-espresso text-cream font-display text-lg font-bold">
              L
            </span>
            <span className="font-display text-xl font-semibold text-espresso">
              LoyaltyForge
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-espresso/70 transition hover:text-espresso"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-parchment/60 to-cream">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gold" />
          <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-espresso" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-5 inline-flex items-center rounded-full bg-pine/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-pine-dark">
                Built for independent cafes
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[1.1] text-espresso md:text-6xl lg:text-[3.5rem]">
                Turn One-Time Visitors Into{" "}
                <span className="text-gold-dark">Loyal Regulars</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-espresso/70">
                The loyalty platform built for cafe owners who want to grow
                without guessing. Create stamp cards, points programs, or VIP
                tiers in minutes — not months.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" className="btn-gold px-7 py-3 text-base">
                  Build Your Program Free
                </Link>
                <a
                  href="#how-it-works"
                  className="btn-secondary px-7 py-3 text-base"
                >
                  See How It Works
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-8 text-sm text-espresso/60">
                <div className="flex items-center gap-2">
                  <span className="text-gold text-lg">&#9733;</span>
                  <span>
                    <strong className="text-espresso">12M+</strong> stamps
                    issued
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold text-lg">&#9733;</span>
                  <span>
                    <strong className="text-espresso">4.9</strong> App Rating
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold text-lg">&#9733;</span>
                  <span>
                    <strong className="text-espresso">80+</strong> countries
                  </span>
                </div>
              </div>
            </div>

            {/* Mock loyalty card */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-80 rotate-3 rounded-2xl bg-gradient-to-br from-espresso to-roast p-6 shadow-2xl transition-transform duration-500 hover:rotate-0">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-espresso">
                      L
                    </span>
                    <span className="font-display text-sm font-semibold text-cream">
                      Loyalty Card
                    </span>
                  </div>
                  <span className="text-xs text-cream/60">Gold Member</span>
                </div>
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gold">
                  Collect 8 stamps, get a free coffee
                </div>
                <div className="grid grid-cols-4 gap-2.5 mb-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg ${
                        i < 5
                          ? "border-gold bg-gold/20 text-gold"
                          : "border-cream/20 bg-cream/5 text-cream/30"
                      }`}
                    >
                      {i < 5 ? "\u2713" : "\u2606"}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-cream/50">
                  <span>Member since Jan 2025</span>
                  <span>5/8 stamps</span>
                </div>
                <div className="mt-4 h-1 rounded-full bg-cream/10">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-gold to-gold-dark" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Logo Cloud ─── */}
      <section className="border-y border-espresso/10 bg-parchment/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-espresso/40">
            Trusted by cafes worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {BRANDS.map((brand) => (
              <span
                key={brand}
                className="font-display text-lg font-semibold text-espresso/25 transition hover:text-espresso/40"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              Simple by design
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              How It Works
            </h2>
          </div>
          <div className="relative grid gap-12 md:grid-cols-3">
            {/* Connecting line (desktop) */}
            <div className="absolute left-[20%] right-[20%] top-8 hidden h-px bg-gradient-to-r from-gold/0 via-gold/40 to-gold/0 md:block" />

            {STEPS.map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-parchment font-display text-2xl font-bold text-espresso transition-transform hover:scale-110">
                  {step.num}
                </div>
                <h3 className="mb-3 font-display text-xl font-semibold text-espresso">
                  {step.title}
                </h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-espresso/65">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              Powerful & flexible
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              Everything You Need
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-espresso/60">
              Whether you run a single shop or a chain, LoyaltyForge gives you
              the tools to build a program that fits your brand perfectly.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card group cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gold/30"
              >
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-display text-lg font-semibold text-espresso">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-espresso/60">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="bg-espresso">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
              Proven results
            </p>
            <h2 className="font-display text-3xl font-semibold text-cream md:text-4xl">
              Loyalty That Pays Off
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="mb-2 font-display text-4xl font-bold text-gold md:text-5xl">
                  {s.value}
                </div>
                <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-cream">
                  {s.label}
                </div>
                <p className="text-xs leading-relaxed text-cream/50">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Integrations ─── */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              Connects to your stack
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              Works With Your Favorite Tools
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {INTEGRATIONS.map((name) => (
              <div
                key={name}
                className="rounded-xl border border-espresso/10 bg-white/70 px-6 py-3 text-sm font-medium text-espresso/70 transition hover:border-gold/40 hover:text-espresso"
              >
                {name}
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-espresso/20 bg-transparent px-6 py-3 text-sm font-medium text-espresso/50">
              REST API
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              Transparent pricing
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              Start Free, Scale When Ready
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-espresso/60">
              No hidden fees. No contracts. Upgrade or downgrade anytime.
            </p>
          </div>
          <div className="grid items-start gap-8 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`card relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  plan.popular
                    ? "border-gold/40 shadow-md ring-1 ring-gold/20"
                    : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-espresso">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display text-xl font-semibold text-espresso">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-espresso/50">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-espresso">
                    {plan.price}
                  </span>
                  <span className="text-espresso/50">{plan.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2.5 text-sm text-espresso/70"
                    >
                      <span className="mt-0.5 text-gold">&#10003;</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center ${
                    plan.popular ? "btn-gold" : "btn-secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              Real cafe owners
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card flex flex-col">
                <div className="mb-4 text-gold text-lg">
                  &#9733;&#9733;&#9733;&#9733;&#9733;
                </div>
                <blockquote className="mb-6 flex-1 text-sm leading-relaxed text-espresso/70">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="border-t border-espresso/10 pt-4">
                  <div className="text-sm font-semibold text-espresso">
                    {t.name}
                  </div>
                  <div className="text-xs text-espresso/50">{t.business}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="bg-parchment/50">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              Common questions
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden !p-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-espresso transition hover:bg-espresso/5"
                >
                  {faq.q}
                  <span
                    className={`ml-4 text-lg transition-transform duration-200 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-espresso/10 px-6 pb-5 pt-4 text-sm leading-relaxed text-espresso/65">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-espresso">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-semibold text-cream md:text-4xl">
            Ready to Build Customer Loyalty?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-cream/60">
            Join thousands of cafe owners who turned one-time buyers into
            lifelong regulars.
          </p>
          <div className="mt-8">
            <Link href="/register" className="btn-gold px-8 py-3.5 text-base">
              Get Started Free
            </Link>
          </div>
          <p className="mt-4 text-xs text-cream/40">
            Free to start. No credit card required.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-espresso/10 bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso text-cream font-display text-sm font-bold">
                  L
                </span>
                <span className="font-display text-lg font-semibold text-espresso">
                  LoyaltyForge
                </span>
              </div>
              <p className="text-sm leading-relaxed text-espresso/50">
                The loyalty platform built for independent cafes. Turn visits
                into habits.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-espresso/40">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-espresso/60">
                <li><a href="#features" className="transition hover:text-espresso">Features</a></li>
                <li><a href="#pricing" className="transition hover:text-espresso">Pricing</a></li>
                <li><a href="#" className="transition hover:text-espresso">API Docs</a></li>
                <li><a href="#" className="transition hover:text-espresso">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-espresso/40">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-espresso/60">
                <li><a href="#" className="transition hover:text-espresso">About</a></li>
                <li><a href="#" className="transition hover:text-espresso">Blog</a></li>
                <li><a href="#" className="transition hover:text-espresso">Careers</a></li>
                <li><a href="#" className="transition hover:text-espresso">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-espresso/40">
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-espresso/60">
                <li><a href="#" className="transition hover:text-espresso">Privacy</a></li>
                <li><a href="#" className="transition hover:text-espresso">Terms</a></li>
                <li><a href="#" className="transition hover:text-espresso">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-espresso/10 pt-6 text-center text-xs text-espresso/40">
            &copy; {new Date().getFullYear()} LoyaltyForge. All rights reserved.
            Built for cafe owners, not enterprises.
          </div>
        </div>
      </footer>
    </div>
  );
}
