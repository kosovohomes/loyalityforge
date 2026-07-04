import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";

export const metadata = {
  title: {
    default: "LoyaltyForge",
    template: "%s | LoyaltyForge",
  },
  description: "The loyalty platform built for independent cafes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-body bg-cream text-espresso antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
