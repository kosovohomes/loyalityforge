import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthSessionProvider>
      {children}
    </AuthSessionProvider>
  );
}
