import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono, IBM_Plex_Mono, Jaini } from "next/font/google";
import "./globals.css";

/* Inter Display — the reference's display face, from the official OFL release. */
const interDisplay = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    { path: "../public/fonts/InterDisplay-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/InterDisplay-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/InterDisplay-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/InterDisplay-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/InterDisplay-Bold.woff2", weight: "700", style: "normal" },
  ],
});

const mono = Geist_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const jaini = Jaini({
  variable: "--font-jaini",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const DESCRIPTION =
  "Custom neural agents, LLM infrastructure and autonomous workflows, engineered for your stack.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://peregrine-partners.vercel.app",
  ),
  title: {
    default: "Peregrine Partners — Applied AI Engineering",
    template: "%s — Peregrine Partners",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Peregrine Partners",
    title: "Peregrine Partners — Applied AI Engineering",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Peregrine Partners" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peregrine Partners — Applied AI Engineering",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${interDisplay.variable} ${mono.variable} ${plex.variable} ${jaini.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
