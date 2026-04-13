import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientShell from '@/components/ClientShell';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TrueCost – Is It Worth Your Time?',
  description:
    'Convert any price into the time you need to earn it. See the true cost of your purchases in hours, days, and years.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TrueCost',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    google: 'notranslate',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning translate="no">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const s = JSON.parse(localStorage.getItem('truecost-storage') || '{}');
                const isDark = !s.state || s.state.darkMode !== false;
                if (isDark) document.documentElement.classList.add('dark');
                var c = isDark ? '#000000' : '#f5f5f7';
                document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.removeAttribute('media'); m.content=c;});
              } catch(e) { document.documentElement.classList.add('dark'); }
              try {
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js');
                  });
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
