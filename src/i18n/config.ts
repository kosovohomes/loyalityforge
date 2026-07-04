export const locales = ["en", "ar", "sq", "ru", "uz"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  sq: "Shqip",
  ru: "Русский",
  uz: "O'zbek",
};

export const rtlLocales: Locale[] = ["ar"];
