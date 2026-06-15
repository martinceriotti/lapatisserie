import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, Great_Vibes, Geist_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "La Patisserie — Pastelería artesanal en Rosario",
    template: "%s | La Patisserie",
  },
  description:
    "Mesas dulces, tortas buttercream y cakepops artesanales para cumpleaños y eventos en Rosario. Personalización total, ingredientes premium.",
  keywords: [
    "pastelería Rosario",
    "mesa dulce Rosario",
    "torta buttercream",
    "cakepops",
    "torta piñata",
    "cumpleaños niños",
    "repostería artesanal",
  ],
  openGraph: {
    title: "La Patisserie — Pastelería artesanal en Rosario",
    description:
      "Mesas dulces, tortas y pastelería artesanal 100% personalizada para tus eventos especiales.",
    locale: "es_AR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${dmSans.variable} ${greatVibes.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
