'use client';

import { useState, useTransition } from 'react';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setFollowAction } from '@/features/follows/actions';

/** Follow / Following toggle; the label swaps in place and the count updates on success. */
export function FollowButton({
  username,
  initial,
  onCountChange,
}: {
  username: string;
  initial: boolean;
  onCountChange?: (delta: number) => void;
}) {
  const [following, setFollowing] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Button
      variant={following ? 'outline' : 'default'}
      aria-pressed={following}
      disabled={pending}
      data-testid="follow-button"
      onClick={() =>
        start(async () => {
          const next = !following;
          const r = await setFollowAction(username, next);
          if (!r.ok) return void toast.error(r.error);
          setFollowing(next);
          onCountChange?.(next ? 1 : -1);
        })
      }
    >
      {!following && <UserPlus aria-hidden />}
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
