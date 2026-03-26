import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-serif-en",
});

const notoSerifJP = Noto_Serif_JP({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-serif-jp",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-sans-jp",
});

export const metadata: Metadata = {
  title: "LUMINA | Lymphatic Drainage Salon",
  description: "心身を解放する、ラグジュアリーなリンパドレナージュサロン LUMINA。",
};

import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${cormorantGaramond.variable} ${notoSerifJP.variable} ${notoSansJP.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <main className="layout-wrapper">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
