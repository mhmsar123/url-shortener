import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || "http://localhost:3000"),
  title: {
    default: "قصّار | مختصر الروابط",
    template: "%s | قصّار",
  },
  description:
    "حوّل الروابط الطويلة إلى روابط قصيرة وسهلة المشاركة في ثوانٍ. خدمة مجانية وسريعة بدون تسجيل، مع إحصائيات ورموز QR.",
  keywords: ["مختصر روابط", "URL Shortener", "رابط قصير", "QR Code", "إحصائيات الروابط"],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    title: "قصّار | مختصر الروابط",
    description:
      "حوّل الروابط الطويلة إلى روابط قصيرة وسهلة المشاركة في ثوانٍ. خدمة مجانية وسريعة بدون تسجيل.",
    siteName: "قصّار",
  },
  twitter: {
    card: "summary_large_image",
    title: "قصّار | مختصر الروابط",
    description:
      "حوّل الروابط الطويلة إلى روابط قصيرة وسهلة المشاركة في ثوانٍ. خدمة مجانية وسريعة بدون تسجيل.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('qs-theme');if(t==='gray'){document.documentElement.classList.add('gray');}else{var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${cairo.variable} font-sans min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
