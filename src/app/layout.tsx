import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MotionProvider } from "@/components/MotionProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LanguageProvider } from "@/contexts/LanguageContext";

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Darix AI",
    locale: "en_AE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          // Runs before paint to set lang/dir from the persisted language
          // preference, avoiding a flash of the wrong text direction on
          // load — same rationale as next-themes' own injected script for
          // dark/light mode.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('darix:locale');if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}}catch(e){}})();`,
          }}
        />
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
            <LanguageProvider>
              <PostHogProvider />
              <Navbar />
              <main>{children}</main>
              <Footer />
              <WhatsAppButton />
            </LanguageProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
