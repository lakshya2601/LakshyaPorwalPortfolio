import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Lakshya Porwal · Investigations',
  description: 'Lakshya Porwal, AI/ML engineer in Indore. Case files: LLMs, RAG and MLOps in production. Plus a short detective game set in rainy Indore.',
  openGraph: {
    title: 'Lakshya Porwal · Investigations',
    description: 'An AI/ML engineer’s portfolio as a detective’s office, with a playable case: The Rain Doesn’t Stop.',
    type: 'website',
  },
};

export const viewport: Viewport = { themeColor: '#070a14' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Playfair+Display:ital,wght@0,600;1,500&family=Courier+Prime:wght@400;700&family=Caveat:wght@500&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
