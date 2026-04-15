import "./globals.css";
import { Exo_2, Plus_Jakarta_Sans, Barlow_Condensed } from "next/font/google";
import { authAdapter } from "@/lib/adapters/auth";

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-data",
  display: "swap",
});
import { prisma } from "@/lib/db";
import AppNav from "@/app/components/AppNav";
import Footer from "@/app/components/Footer";
import DemoBanner from "@/app/components/DemoBanner";
import CommandPalette from "@/app/components/CommandPalette";
import DataConsentModal from "@/app/components/DataConsentModal";
import CookieConsent from "@/app/components/CookieConsent";
import HelpWidget from "@/app/components/HelpWidget";
import ThemeProvider from "@/app/components/ThemeProvider";
import NoiseOverlay from "@/app/components/effects/NoiseOverlay";
import GradientOrbs from "@/app/components/effects/GradientOrbs";
import InstallPrompt from "@/app/components/InstallPrompt";
import BottomNav from "@/app/components/BottomNav";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
};

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  icons: {
    icon: [
      { url: "/images/logos/favicon-teal.png", media: "(prefers-color-scheme: light)" },
      { url: "/images/logos/favicon-white.png", media: "(prefers-color-scheme: dark)" },
      { url: "/images/logos/favicon-teal.png" },
    ],
    apple: "/images/logos/apple-touch-icon-180.png",
  },
  title: "LegacyLoop — AI-Powered Estate Sales",
  description:
    "Turn your family's belongings into meaningful income. AI pricing, buyer matching, and white-glove service for estate sales in Maine and beyond.",
  keywords: [
    "estate sales",
    "AI pricing",
    "legacy preservation",
    "Maine estate sale",
    "online estate sale",
    "family belongings",
  ],
  openGraph: {
    title: "LegacyLoop — AI-Powered Estate Sales",
    description:
      "Turn your family's belongings into meaningful income — with expert AI pricing, buyer matching, and white-glove service.",
    siteName: "LegacyLoop",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LegacyLoop — AI-Powered Estate Sales",
    description:
      "Turn your family's belongings into meaningful income — with expert AI pricing, buyer matching, and white-glove service.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await authAdapter.getSession();

  // Check if logged-in user has already seen the data consent modal.
  // Wrapped in try/catch — if the table doesn't exist yet (pending migration)
  // the app still loads; the modal just stays hidden.
  let showConsentModal = false;
  let alertCount = 0;
  let unreadCount = 0;
  let creditBalance = 0;

  if (user) {
    try {
      const consent = await prisma.dataCollectionConsent.findUnique({
        where: { userId: user.id },
      });
      showConsentModal = !consent;
    } catch {
      // Table missing or DB error — skip modal, don't crash
    }

    try {
      const [alerts, unread, notifCount, credits] = await Promise.all([
        prisma.reconAlert.count({
          where: { reconBot: { userId: user.id }, dismissed: false },
        }),
        prisma.message.count({
          where: {
            conversation: { item: { userId: user.id } },
            sender: "buyer",
            isRead: false,
          },
        }),
        prisma.notification.count({
          where: { userId: user.id, isRead: false },
        }),
        prisma.userCredits.findUnique({
          where: { userId: user.id },
          select: { balance: true },
        }),
      ]);
      alertCount = alerts + notifCount;
      unreadCount = unread;
      creditBalance = credits?.balance ?? 0;
    } catch {
      // Tables missing or DB error — nav shows zero counts
    }
  }

  return (
    <html lang="en" className={`dark ${exo2.variable} ${plusJakarta.variable} ${barlowCondensed.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('ll-theme') || 'dark';
              var r = t === 'auto'
                ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                : t;
              document.documentElement.className = r;
            } catch(e) { document.documentElement.className = 'dark'; }
          })();
        `}} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LegacyLoop" />
        <meta name="theme-color" content="#00bcd4" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/images/logos/favicon-teal.png" media="(prefers-color-scheme: light)" sizes="454x451" />
        <link rel="icon" type="image/png" href="/images/logos/favicon-white.png" media="(prefers-color-scheme: dark)" sizes="454x451" />
        <link rel="apple-touch-icon" href="/images/logos/apple-touch-icon-180.png" />
        {/* CMD-PWA-INSTALL: Register service worker for PWA install + offline */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('SW registered:', reg.scope); })
                .catch(function(err) { console.log('SW registration failed:', err); });
            });
          }
        `}} />
      </head>
      <body className="min-h-screen">
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <ThemeProvider>
          <GradientOrbs />
          <NoiseOverlay />
          <CommandPalette />
          <DemoBanner />
          <AppNav
            user={user ? { id: user.id, email: user.email, tier: user.tier, heroVerified: user.heroVerified } : null}
            alertCount={alertCount}
            unreadCount={unreadCount}
            creditBalance={creditBalance}
          />

          <main id="main-content" className="container-app py-10">{children}</main>
          <Footer />
          <BottomNav unreadCount={unreadCount} />
          <HelpWidget />
          <InstallPrompt />
          <DataConsentModal show={showConsentModal} />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}