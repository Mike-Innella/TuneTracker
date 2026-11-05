import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand/logo';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center px-6 py-20">
      <LogoMark size={56} className="drop-shadow-[0_0_24px_rgb(58_107_255/0.45)]" />
      <p className="type-figure mt-8 text-sm text-electric">404</p>
      <h1 className="type-title mt-2 text-4xl sm:text-5xl">This track isn’t on the record.</h1>
      <p className="mt-4 text-muted-foreground">
        The page may have been removed, made private, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/home">Go home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
