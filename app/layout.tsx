import type { Metadata } from "next";
import { Inter, Geist_Mono, Jaini } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

const jaini = Jaini({
  variable: "--font-jaini",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peregrine Partners — Applied AI Engineering",
  description:
    "Custom neural agents, LLM infrastructure and autonomous workflows, engineered for your stack.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${jaini.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
