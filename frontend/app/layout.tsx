import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NewsTicker from "@/components/NewsTicker"; // <-- 1. EKLEME

const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "DIGITAL PROPHETS | Prediction Terminal",
  description: "Market intelligence for gamers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrains.variable} font-mono bg-cyber-black text-white antialiased overflow-hidden`}>
        {/* Arka plan ızgarası */}
        <div className="fixed inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-20 pointer-events-none z-0" />
        
        {/* İçerik Katmanı */}
        <div className="relative z-10 h-screen flex flex-col pb-8"> {/* pb-8 ekledik ki yazı altta kalmasın */}
           {children}
        </div>

        {/* HABER BANDI (Her sayfada görünecek) */}
        <NewsTicker /> {/* <-- 2. EKLEME */}
        
      </body>
    </html>
  );
}