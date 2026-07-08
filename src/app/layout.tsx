import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AgroNex", template: "%s | AgroNex" },
  description: "Control diario de labores agrícolas por cuadrilla, sector y cultivo.",
  applicationName: "AgroNex",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AgroNex" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/agronex-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/agronex-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/agronex-apple-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "AgroNex",
    description: "Control diario de labores agrícolas por cuadrilla, sector y cultivo.",
    url: "/",
    siteName: "AgroNex",
    locale: "es_PE",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#164c37",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${manrope.variable} font-sans antialiased`}>{children}</body></html>;
}
