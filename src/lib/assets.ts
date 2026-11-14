/**
 * Asset URL helpers. The site can be hosted under a sub-path (for example a
 * GitHub Pages project site), so every asset URL is prefixed with the base
 * path the build was configured with.
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/+$/, '');

/** URL for a file under `public/assets`, e.g. `approved/items/x.png`. */
export function assetUrl(path: string): string {
  return `${BASE_PATH}/assets/${path.replace(/^\/+/, '')}`;
}
