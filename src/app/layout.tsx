import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";
import ThemeClient from "@/components/providers/theme-client";

export const metadata: Metadata = {
  title: "EnCare - Care Logging Made Simple",
  description: "Fast, simple care logging for care homes and support workers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EnCare",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans">
        <ThemeClient>
          <ToastProvider>{children}</ToastProvider>
        </ThemeClient>
      </body>
    </html>
  );
}
