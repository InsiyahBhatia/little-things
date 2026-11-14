/** A pixel coin drawn on an 8x8 grid so it matches the art. */
export function CoinIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      <path fill="var(--ink)" d="M2 0h4v1h1v1h1v4H7v1H6v1H2V7H1V6H0V2h1V1h1z" />
      <path fill="var(--honey)" d="M2 1h4v1h1v4H6v1H2V6H1V2h1z" />
      <path fill="var(--honey-deep)" d="M3 2h2v1H4v2h1v1H3z" />
      <path fill="#fff3c4" d="M2 2h1v1H2z" />
    </svg>
  );
}
