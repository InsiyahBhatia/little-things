import { assetUrl } from '@/lib/assets';

interface SpriteProps {
  /** Path under `public/assets`. */
  src: string;
  alt: string;
  /** Rendered size of the longest side, in CSS pixels. */
  size: number;
  /**
   * For single-row sprite sheets: the size of one frame. Only the first frame
   * is shown.
   */
  frame?: { width: number; height: number };
  className?: string;
}

/** A pixel-art image from the game's assets, scaled without blurring. */
export function Sprite({ src, alt, size, frame, className = '' }: SpriteProps) {
  const url = assetUrl(src);

  if (frame) {
    const scale = size / Math.max(frame.width, frame.height);
    const height = frame.height * scale;
    return (
      <span
        role="img"
        aria-label={alt}
        className={`pixelated inline-block bg-no-repeat ${className}`}
        style={{
          width: frame.width * scale,
          height,
          backgroundImage: `url("${url}")`,
          // Height-based sizing keeps the sheet's aspect ratio, so the first
          // frame exactly fills the box.
          backgroundSize: `auto ${height}px`,
          backgroundPosition: '0 0',
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; pixel art must not be resampled
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={`pixelated object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
