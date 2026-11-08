import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://downloader.bytelog.lat'),
  title: "ByteDownloader HD - Descargar Videos e Historias de TikTok sin Marca de Agua",
  description: "Descarga videos de TikTok en Full HD 1080p, historias de 24 horas, galerías de fotos y audio MP3 gratis sin marca de agua. Rápido, anónimo y sin registrarse.",
  keywords: [
    "descargar videos de tiktok",
    "descargar historias de tiktok",
    "tiktok downloader sin marca de agua",
    "descargar fotos de tiktok",
    "bajar videos de tiktok en hd",
    "descargar perfil de tiktok completo",
    "tiktok video downloader",
    "descargar audio de tiktok mp3"
  ],
  authors: [{ name: "ByteDownloader" }],
  creator: "ByteDownloader",
  publisher: "ByteDownloader",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "ByteDownloader HD - Descargar Videos e Historias de TikTok",
    description: "Descarga videos en 1080p, historias de 24h, galerías de fotos y perfiles de TikTok sin marca de agua y gratis.",
    url: "https://downloader.bytelog.lat",
    siteName: "ByteDownloader HD",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "ByteDownloader HD Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ByteDownloader HD - Descargador de TikTok",
    description: "Descarga videos, historias y fotos de TikTok en Full HD sin marca de agua.",
    images: ["/icon.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport = {
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ByteDownloader HD",
    "url": "https://downloader.bytelog.lat",
    "description": "Herramienta online gratuita para descargar videos, historias de 24h, fotos y audios de TikTok sin marca de agua en alta resolución.",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `
          }}
        />
        <script src="https://quge5.com/88/tag.min.js" data-zone="242786" async data-cfasync="false"></script>
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-200">{children}</body>
    </html>
  );
}
