import type { NextConfig } from 'next';

/**
 * Built as a fully static site (`out/`) that any static host or CDN can serve.
 * Set NEXT_PUBLIC_BASE_PATH (e.g. "/little-things") when serving from a
 * sub-path such as a GitHub Pages project site.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  trailingSlash: true,
  // Phaser owns its own render loop; double-mounting in dev would start two games.
  reactStrictMode: false,
  poweredByHeader: false,
  images: { unoptimized: true },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
