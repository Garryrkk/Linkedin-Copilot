import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MagneticCursor } from "@/components/shared/magnetic-cursor";
import { CommandPalette } from "@/components/dock/command-palette";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Audience AI — Founder Engagement Operating System",
  description:
    "Analyze, strategize, and engage. The intelligence layer for founders who win the comment section.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg-primary text-highlight">
        <Providers>
          {children}
          <MagneticCursor />
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
