"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { useState, useRef, useEffect } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSwitch(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-espresso/15 bg-white/70 px-3 py-1.5 text-sm font-medium text-espresso transition hover:border-gold/40 hover:bg-white"
      >
        <span className="text-base">
          {locale === "en" ? "🇬🇧" : locale === "ar" ? "🇸🇦" : locale === "sq" ? "🇦🇱" : locale === "ru" ? "🇷🇺" : "🇺🇿"}
        </span>
        {localeNames[locale as Locale]}
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-espresso/10 bg-white shadow-lg">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => handleSwitch(l)}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition hover:bg-espresso/5 ${
                l === locale ? "font-semibold text-espresso bg-gold/10" : "text-espresso/70"
              }`}
            >
              <span className="text-base">
                {l === "en" ? "🇬🇧" : l === "ar" ? "🇸🇦" : l === "sq" ? "🇦🇱" : l === "ru" ? "🇷🇺" : "🇺🇿"}
              </span>
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
