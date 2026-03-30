import type {Metadata} from 'next';
import {Analytics} from '@vercel/analytics/next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'FretMaster Pro',
  description: 'Interactive guitar training app with scales, arpeggios, metronome, and AI theory coaching.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
