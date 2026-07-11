import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Outfit } from "next/font/google";
import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { FaqChatWidget } from "@/components/chatbot/FaqChatWidget";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { defaultLocale, isLocale, localeDirection, locales, type Locale } from "@/lib/i18n/translations";
import { localePath } from "@/lib/i18n/paths";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://darix.ai";
const title = "Dubai AI Readiness Index | AI Readiness Assessment for Businesses";
const description = "Assess your organization's AI readiness with DARIX AI. Measure strategy, data maturity, automation potential, governance risk, and AI business value through a premium AI readiness dashboard.";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Darix AI",
  alternateName: "Dubai AI Readiness Index",
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
  email: "hello@darix.ai",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Dubai",
    addressCountry: "AE",
  },
  sameAs: [
    "https://www.linkedin.com/in/krishnamathurmay/",
    "https://github.com/krish2105",
  ],
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Darix AI Readiness Assessment",
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "AED",
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: localePath(locale, "/"),
      languages: {
        en: localePath("en", "/"),
        ar: localePath("ar", "/"),
        "x-default": localePath(defaultLocale, "/"),
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${localePath(locale, "/")}`,
      siteName: "Darix AI",
      locale: locale === "ar" ? "ar_AE" : "en_AE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  const direction = localeDirection[locale];

  return (
    <html lang={locale} dir={direction} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MotionProvider>
            <LanguageProvider locale={locale}>
              <PostHogProvider />
              <Navbar />
              <main>{children}</main>
              <Footer />
              <WhatsAppButton />
              <FaqChatWidget />
              <ServiceWorkerRegistration />
            </LanguageProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
