import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, rtlLocales, type Locale } from "@/i18n/config";
import { setRequestLocale } from "next-intl/server";
import { AuthSessionProvider } from "@/components/session-provider";

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata() {
  return {
    title: {
      default: "LoyaltyForge",
      template: "%s | LoyaltyForge",
    },
    description: "The loyalty platform built for independent cafes",
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const locale = params.locale;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={dir === "rtl" ? "rtl" : ""}>
      <body className="font-body bg-cream text-espresso antialiased">
        <AuthSessionProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
