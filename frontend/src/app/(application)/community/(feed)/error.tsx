'use client';

import { Button } from '@/components/ui/button';

export default function CommunityError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center" role="alert">
      <h1 className="type-title text-2xl">The feed didn’t load</h1>
      <p className="mt-2 text-muted-foreground">Something went wrong on our side. Your posts are safe.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
