import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { PlayerProvider } from '@/providers/player-provider';
import { MiniPlayer } from '@/components/audio/mini-player';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const description =
  'A workspace for music projects: Kanban boards shaped like your production workflow, collaborators with real roles, and a community to share demos and finished tracks.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'TuneTracker 2.0 — Create. Collaborate. Share.', template: '%s · TuneTracker' },
  description,
  applicationName: 'TuneTracker',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'TuneTracker',
    title: 'TuneTracker 2.0 — Create. Collaborate. Share.',
    description,
    url: siteUrl,
  },
  twitter: { card: 'summary_large_image', title: 'TuneTracker 2.0', description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#060a1c' },
    { media: '(prefers-color-scheme: light)', color: '#f3f5fb' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <ThemeProvider>
          <PlayerProvider>
            {children}
            <MiniPlayer />
          </PlayerProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
