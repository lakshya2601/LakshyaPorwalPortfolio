import type { Metadata, Viewport } from "next";
import "./globals.css";
import { profile } from "@/data/content";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.title}`,
  description: "AI/ML engineer and full stack developer. Climb the expedition: from a golden valley to the stars.",
  openGraph: {
    title: `${profile.name} — The Expedition`,
    description: "AI/ML engineer and full stack developer portfolio.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0a1030" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
