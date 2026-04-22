import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wanas.sa"),
  title: {
    default: "ونس — سوق المناسبات في جدة",
    template: "%s | ونس",
  },
  description:
    "اكتشف أفضل الشاليهات، البوفيهات، وتنسيق الحفلات في جدة. تواصل مباشر مع المزودين عبر واتساب بدون عمولة.",
  keywords: ["شاليهات جدة", "بوفيهات مناسبات", "تنسيق حفلات جدة", "ونس", "حجز شاليه"],
  authors: [{ name: "ونس" }],
  creator: "ونس",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "https://wanas.sa",
    siteName: "ونس",
    title: "ونس — سوق المناسبات في جدة",
    description: "اكتشف أفضل الشاليهات، البوفيهات، وتنسيق الحفلات في جدة.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "ونس" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ونس — سوق المناسبات في جدة",
    description: "اكتشف أفضل الشاليهات والبوفيهات في جدة.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="selection:bg-[#f63659] selection:text-white"
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased font-cairo w-full max-w-[100vw]">{children}</body>
    </html>
  );
}
