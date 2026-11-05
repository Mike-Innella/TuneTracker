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

export function Wordmark({ className, version = true }: { className?: string; version?: boolean }) {
  return (
    <span
      className={cn('type-title text-[1.15rem] leading-none tracking-[-0.02em] whitespace-nowrap', className)}
    >
      TuneTracker{version && <span className="ml-1 text-electric not-italic"> 2.0</span>}
    </span>
  );
}

export function Logo({
  href = '/',
  size = 32,
  version = true,
}: {
  href?: string;
  size?: number;
  version?: boolean;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-md" aria-label="TuneTracker home">
      <LogoMark size={size} />
      <Wordmark version={version} />
    </Link>
  );
}
