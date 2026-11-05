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
    // eslint-disable-next-line @next/next/no-img-element -- user media from Supabase storage
    return (
      <img
        src={url}
        alt=""
        className={cn('shrink-0 rounded-md border border-border object-cover', className)}
      />
    );
  }
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const angle = hash % 360;
  return (
    <span
      aria-hidden
      className={cn(
        'type-title grid shrink-0 place-items-center rounded-md border border-border text-sm text-white',
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, #0b1440 0%, #2f5cf0 55%, #8a3cf0 100%)`,
      }}
    >
      {title.slice(0, 2).toUpperCase()}
    </span>
  );
}
