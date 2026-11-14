import { Nunito, Pixelify_Sans } from 'next/font/google';

/** Names, titles, buttons and numbers, in the interface and inside the game canvas. */
export const displayFont = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
  display: 'swap',
});

/** Anything read as a sentence. */
export const bodyFont = Nunito({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-body',
  display: 'swap',
});
