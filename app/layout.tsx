import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سجل المخاطر ولوحة مؤشرات GRC",
  description: "تطبيق عربي لإدارة المخاطر التقنية والأمنية ضمن مفاهيم GRC.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
