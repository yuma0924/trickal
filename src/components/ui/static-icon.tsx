interface StaticIconProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/** /public 配下の小さな静的アイコン用。decoding="sync" で再マウント時の点滅を防止 */
export function StaticIcon({ src, alt, width, height, className }: StaticIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding="sync"
    />
  );
}
