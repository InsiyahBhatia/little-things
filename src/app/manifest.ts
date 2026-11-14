import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Little Things',
    short_name: 'Little Things',
    description: 'Run a tiny potion shop in the village of Mallowmere.',
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: '#1b1424',
    theme_color: '#1b1424',
    categories: ['games'],
    icons: [
      { src: `${basePath}/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${basePath}/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
  };
}
