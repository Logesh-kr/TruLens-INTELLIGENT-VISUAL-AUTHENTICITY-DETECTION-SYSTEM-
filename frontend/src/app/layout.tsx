import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TruLens — AI-Powered Visual Authenticity Analysis",
  description: "Analyze subtle visual patterns to estimate whether an image is AI-generated or authentic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} bg-brand-bg text-slate-200 font-sans antialiased min-h-screen selection:bg-brand-cyan/20 selection:text-brand-cyan relative overflow-x-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
