"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV_LINKS = [
  { labelKey: "features", href: "#features" },
  { labelKey: "howItWorks", href: "#how-it-works" },
  { labelKey: "pricing", href: "#pricing" },
  { labelKey: "stories", href: "#testimonials" },
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
    titleKey: "step1.title",
    descKey: "step1.desc",
  },
  {
    num: "02",
    titleKey: "step2.title",
    descKey: "step2.desc",
  },
  {
    num: "03",
    titleKey: "step3.title",
    descKey: "step3.desc",
  },
];

const FEATURES_LIST = [
  { icon: "📋", titleKey: "stampCards.title", descKey: "stampCards.desc" },
  { icon: "💰", titleKey: "points.title", descKey: "points.desc" },
  { icon: "🏆", titleKey: "tiered.title", descKey: "tiered.desc" },
  { icon: "🎯", titleKey: "challenges.title", descKey: "challenges.desc" },
  { icon: "🎁", titleKey: "rewards.title", descKey: "rewards.desc" },
  { icon: "🎲", titleKey: "scratch.title", descKey: "scratch.desc" },
];

const STATS = [
  { value: "15-30%", descKey: "stat1Label" },
  { value: "2x", descKey: "stat2Label" },
  { value: "48%", descKey: "stat3Label" },
  { value: "3x", descKey: "roiLabel" },
];

const INTEGRATIONS = ["REST API", "QR Code Sign-up", "Embeddable Widget", "JSON Webhooks"];

const PLANS = [
  {
    nameKey: "starter.name",
    price: "$0",
    period: "/mo",
    descKey: "starter.desc",
    features: [
      "Up to 100 members",
      "1 active program",
      "Stamp card or points",
      "QR code sign-up",
      "Basic analytics",
      "Contact form support",
    ],
    ctaKey: "cta",
    popular: false,
  },
  {
    nameKey: "growth.name",
    price: "$29",
    period: "/mo",
    descKey: "growth.desc",
    features: [
      "Up to 5,000 members",
      "Unlimited programs",
      "All program types (stamp, points, tiered)",
      "Embeddable widget",
      "Advanced analytics (CLV, churn, ROI)",
      "Full REST API access",
      "Challenges & rewards catalog",
    ],
    ctaKey: "ctaGrowing",
    popular: true,
  },
  {
    nameKey: "scale.name",
    price: "$99",
    period: "/mo",
    descKey: "scale.desc",
    features: [
      "Unlimited members",
      "Everything in Growth",
      "Multi-location support",
      "Referral & OneStamp system",
      "Scratch & Win games",
      "GDPR consent management",
    ],
    ctaKey: "ctaContact",
    popular: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "We launched LoyaltyForge on a Monday. By Friday we had 200 members. Three months later, our repeat customer rate jumped 28%. It's the best investment we've made.",
    name: "Maria Chen",
    business: "Sunrise Coffee, Portland",
  },
  {
    quote: "Our old paper stamp cards kept getting lost. LoyaltyForge digitized the whole experience and our customers love checking their progress on their phones.",
    name: "James O'Brien",
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
    qKey: "faq1.q",
    aKey: "faq1.a",
  },
  {
    qKey: "faq2.q",
    aKey: "faq2.a",
  },
  {
    qKey: "faq3.q",
    aKey: "faq3.a",
  },
  {
    qKey: "faq4.q",
    aKey: "faq4.a",
  },
  {
    qKey: "faq5.q",
    aKey: "faq5.a",
  },
  {
    qKey: "faq6.q",
    aKey: "faq6.a",
  },
];

export default function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-espresso/10 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-espresso text-cream font-display text-lg font-bold">
              L
            </span>
            <span className="font-display text-xl font-semibold text-espresso">
              {tc("appName")}
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-espresso/70 transition hover:text-espresso"
              >
                {t(`nav.${link.labelKey}`)}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="btn-secondary hidden sm:inline-flex">
              {t("nav.signIn")}
            </Link>
            <Link href="/register" className="btn-primary">
              {t("nav.getStarted")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-parchment/60 to-cream">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gold" />
          <div className="absolute -left-20 bottom-0 h-[400px] w-[400px] rounded-full bg-espresso" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-5 inline-flex items-center rounded-full bg-pine/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-pine-dark">
                {t("hero.badge")}
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[1.1] text-espresso md:text-6xl lg:text-[3.5rem]">
                {t("hero.title1")}{" "}
                <span className="text-gold-dark">{t("hero.titleHighlight")}</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-espresso/70">
                {t("hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/register" className="btn-gold px-7 py-3 text-base">
                  {t("hero.cta1")}
                </Link>
                <a href="#how-it-works" className="btn-secondary px-7 py-3 text-base">
                  {t("hero.cta2")}
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-8 text-sm text-espresso/60">
                <div className="flex items-center gap-2">
                  <span className="text-gold text-lg">&#9733;</span>
                  <span><strong className="text-espresso">{t("hero.stat1Value")}</strong> {t("hero.stat1Label")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold text-lg">&#9733;</span>
                  <span><strong className="text-espresso">{t("hero.stat2Value")}</strong> {t("hero.stat2Label")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold text-lg">&#9733;</span>
                  <span><strong className="text-espresso">{t("hero.stat3Value")}</strong> {t("hero.stat3Label")}</span>
                </div>
              </div>
            </div>

            {/* Mock loyalty card */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-80 rotate-3 rounded-2xl bg-gradient-to-br from-espresso to-roast p-6 shadow-2xl transition-transform duration-500 hover:rotate-0">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-espresso">L</span>
                    <span className="font-display text-sm font-semibold text-cream">Loyalty Card</span>
                  </div>
                  <span className="text-xs text-cream/60">Gold Member</span>
                </div>
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gold">
                  Collect 8 stamps, get a free coffee
                </div>
                <div className="grid grid-cols-4 gap-2.5 mb-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg ${i < 5 ? "border-gold bg-gold/20 text-gold" : "border-cream/20 bg-cream/5 text-cream/30"}`}>
                      {i < 5 ? "✓" : "☆"}
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

      {/* Logo Cloud */}
      <section className="border-y border-espresso/10 bg-parchment/40">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-espresso/40">
            {t("brands.title")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {BRANDS.map((brand) => (
              <span key={brand} className="font-display text-lg font-semibold text-espresso/25 transition hover:text-espresso/40">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              {t("howItWorks.subtitle")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              {t("howItWorks.title")}
            </h2>
          </div>
          <div className="relative grid gap-12 md:grid-cols-3">
            <div className="absolute left-[20%] right-[20%] top-8 hidden h-px bg-gradient-to-r from-gold/0 via-gold/40 to-gold/0 md:block" />
            {STEPS.map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-parchment font-display text-2xl font-bold text-espresso transition-transform hover:scale-110">
                  {step.num}
                </div>
                <h3 className="mb-3 font-display text-xl font-semibold text-espresso">
                  {t(`howItWorks.${step.titleKey}`)}
                </h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-espresso/65">
                  {t(`howItWorks.${step.descKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              {t("features.subtitle")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              {t("features.title")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES_LIST.map((f) => (
              <div key={f.titleKey} className="card group cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gold/30">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-display text-lg font-semibold text-espresso">
                  {t(`features.${f.titleKey}`)}
                </h3>
                <p className="text-sm leading-relaxed text-espresso/60">
                  {t(`features.${f.descKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-espresso">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">
              {t("stats.subtitle")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-cream md:text-4xl">
              {t("stats.title")}
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.descKey} className="text-center">
                <div className="mb-2 font-display text-4xl font-bold text-gold md:text-5xl">{s.value}</div>
                <p className="text-xs leading-relaxed text-cream/50">
                  {t(`stats.${s.descKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              {t("integrations.title")}
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {INTEGRATIONS.map((name) => (
              <div key={name} className="rounded-xl border border-espresso/10 bg-white/70 px-6 py-3 text-sm font-medium text-espresso/70 transition hover:border-gold/40 hover:text-espresso">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-parchment/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              {t("pricing.subtitle")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              {t("pricing.title")}
            </h2>
          </div>
          <div className="grid items-start gap-8 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.nameKey} className={`card relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${plan.popular ? "border-gold/40 shadow-md ring-1 ring-gold/20" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-espresso">
                    {t("pricing.growth.popular")}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display text-xl font-semibold text-espresso">
                    {t(`pricing.${plan.nameKey}`)}
                  </h3>
                  <p className="mt-1 text-sm text-espresso/50">{t(`pricing.${plan.descKey}`)}</p>
                </div>
                <div className="mb-6">
                  <span className="font-display text-4xl font-bold text-espresso">{plan.price}</span>
                  <span className="text-espresso/50">{plan.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-espresso/70">
                      <span className="mt-0.5 text-gold">&#10003;</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block w-full text-center ${plan.popular ? "btn-gold" : "btn-secondary"}`}>
                  {t(`pricing.${plan.ctaKey}`)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              {t("testimonials.subtitle")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              {t("testimonials.title")}
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((tst) => (
              <div key={tst.name} className="card flex flex-col">
                <div className="mb-4 text-gold text-lg">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <blockquote className="mb-6 flex-1 text-sm leading-relaxed text-espresso/70">
                  &ldquo;{tst.quote}&rdquo;
                </blockquote>
                <div className="border-t border-espresso/10 pt-4">
                  <div className="text-sm font-semibold text-espresso">{tst.name}</div>
                  <div className="text-xs text-espresso/50">{tst.business}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-parchment/50">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-dark">
              {t("faq.subtitle")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-espresso md:text-4xl">
              {t("faq.title")}
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden !p-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-espresso transition hover:bg-espresso/5"
                >
                  {t(`faq.${faq.qKey}`)}
                  <span className={`ml-4 text-lg transition-transform duration-200 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="border-t border-espresso/10 px-6 pb-5 pt-4 text-sm leading-relaxed text-espresso/65">
                    {t(`faq.${faq.aKey}`)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-espresso">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-display text-3xl font-semibold text-cream md:text-4xl">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-cream/60">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8">
            <Link href="/register" className="btn-gold px-8 py-3.5 text-base">
              {t("cta.button")}
            </Link>
          </div>
          <p className="mt-4 text-xs text-cream/40">
            {t("cta.note")}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-espresso/10 bg-cream">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso text-cream font-display text-sm font-bold">L</span>
                <span className="font-display text-lg font-semibold text-espresso">{tc("appName")}</span>
              </div>
              <p className="text-sm leading-relaxed text-espresso/50">
                {t("footer.copyright")}
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-espresso/40">{t("footer.product")}</h4>
              <ul className="space-y-2 text-sm text-espresso/60">
                <li><a href="#features" className="transition hover:text-espresso">{t("footer.features")}</a></li>
                <li><a href="#pricing" className="transition hover:text-espresso">{t("footer.pricing")}</a></li>
                <li><Link href="/settings/api-keys" className="transition hover:text-espresso">{t("footer.apiDocs")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-espresso/40">{t("footer.company")}</h4>
              <ul className="space-y-2 text-sm text-espresso/60">
                <li><Link href="/support" className="transition hover:text-espresso">{t("footer.contactSupport")}</Link></li>
                <li><Link href="/register" className="transition hover:text-espresso">{t("footer.getStarted")}</Link></li>
                <li><Link href="/login" className="transition hover:text-espresso">{t("footer.signIn")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-espresso/40">{t("footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-espresso/60">
                <li><a href="#" className="transition hover:text-espresso">Privacy</a></li>
                <li><a href="#" className="transition hover:text-espresso">Terms</a></li>
                <li><a href="#" className="transition hover:text-espresso">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-espresso/10 pt-6 text-center text-xs text-espresso/40">
            &copy; {new Date().getFullYear()} {tc("appName")}. {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
