import type { Metadata, Viewport } from 'next';
import { bodyFont, displayFont } from './fonts';
import './globals.css';

const TITLE = 'Little Things';
const DESCRIPTION =
  'Run a tiny potion shop in the village of Mallowmere. Pick flowers, brew potions and serve curious customers in this cosy pixel-art game.';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://insiyahbhatia.github.io/little-things';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

// metadataBase must be the domain origin so Next.js doesn't duplicate basePath in file-based og images
const metadataBaseOrigin = new URL(siteUrl).origin;

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseOrigin),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  manifest: `${basePath}/manifest.webmanifest`,
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${basePath}/og-image.png`,
        width: 1280,
        height: 720,
        alt: 'Little Things - A cosy pixel-art potion shop game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${basePath}/og-image.png`],
  },
  appleWebApp: { capable: true, title: TITLE, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#1b1424',
  width: 'device-width',
  initialScale: 1,
  // A game should not zoom when a player double-taps or pinches the controls.
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * The site is a static export, so the policy ships as a meta tag and works on
 * any host. Next.js needs inline scripts and styles to hydrate; everything
 * else is limited to this origin. (Development needs eval for hot reload, so
 * the policy is only applied to production builds.)
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        )}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>{children}</body>
    </html>
  );
}
