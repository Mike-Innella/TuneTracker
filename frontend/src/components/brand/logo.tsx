import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/branding/logo-mark.svg"
      alt=""
      width={size}
      height={size}
      unoptimized
      priority
      className={cn('shrink-0 select-none', className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn('type-title text-[1.15rem] leading-none tracking-[-0.02em] whitespace-nowrap', className)}
    >
      TuneTracker
    </span>
  );
}

export function Logo({
  href = '/',
  size = 32,
  compact = false,
}: {
  href?: string;
  size?: number;
  /** hide the wordmark on very narrow phones (<360px) so the bar never overflows */
  compact?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-md">
      <LogoMark size={size} />
      <Wordmark className={compact ? 'max-[359px]:sr-only' : undefined} />
    </Link>
  );
}
