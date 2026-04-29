import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jahon Bozor Aksiyasi",
  description: "Farg'onada BYD Champion yuting!",
  icons: {
    icon: [
      {
        url: "/optimized/favicon-light.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/optimized/favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/optimized/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="icon"
          href="/optimized/favicon-light.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/optimized/favicon-dark.png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="apple-touch-icon" href="/optimized/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
