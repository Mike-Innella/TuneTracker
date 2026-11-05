'use client';

import { useState } from 'react';
import { CountingNumber } from '@animate-ui/react/primitives/texts/counting-number';
import { FollowButton } from './follow-button';

/** Follower / following counts as a credits line, with the follow control beside them. */
export function FollowStats({
  username,
  followers,
  following,
  isFollowing,
  canFollow,
}: {
  username: string;
  followers: number;
  following: number;
  isFollowing: boolean;
  canFollow: boolean;
}) {
  const [count, setCount] = useState(followers);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <dl className="flex gap-6" data-testid="follow-stats">
        <div className="flex items-baseline gap-2">
          <dd className="text-lg">
            <CountingNumber number={count} className="type-figure tabular-nums" />
          </dd>
          <dt className="type-role text-muted-foreground">Followers</dt>
        </div>
        <div className="flex items-baseline gap-2">
          <dd className="type-figure text-lg">{following}</dd>
          <dt className="type-role text-muted-foreground">Following</dt>
        </div>
      </dl>
      {canFollow && (
        <FollowButton
          username={username}
          initial={isFollowing}
          onCountChange={(d) => setCount((c) => c + d)}
        />
      )}
    </div>
  );
}
