import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cybersecurity GRC Risk Management",
  description: "Management-level risk submission, GRC assessment, treatment tracking, and executive reporting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
