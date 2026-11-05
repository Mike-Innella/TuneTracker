import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Uploaded artwork, or a generated sleeve: initials on the logo light, deterministic per title. */
export function ProjectArtwork({
  title,
  url,
  className,
}: {
  title: string;
  url?: string | null;
  className?: string;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={160}
        height={160}
        unoptimized
        className={cn('shrink-0 rounded-md border border-border object-cover', className)}
      />
    );
  }
  // Unlit sleeve: navy stock, hairline frame, initials set like a catalogue number.
  return (
    <span
      aria-hidden
      className={cn(
        'type-title relative grid shrink-0 place-items-center overflow-hidden rounded-md border border-rule bg-stock-2 text-sm text-foreground',
        className,
      )}
    >
      <span className="absolute inset-x-1.5 top-1.5 h-px bg-rule" />
      {title.slice(0, 2).toUpperCase()}
      <span className="absolute inset-x-1.5 bottom-1.5 h-px bg-rule" />
    </span>
  );
}
