'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { resolveReportAction } from '@/features/moderation/actions';

export function ReportActions({
  reportId,
  targetType,
  targetGone,
}: {
  reportId: string;
  targetType: 'POST' | 'COMMENT' | 'PROFILE' | 'ARTICLE';
  targetGone: boolean;
}) {
  const [pending, start] = useTransition();
  const act = (outcome: string, done: string) =>
    start(async () => {
      const r = await resolveReportAction({ reportId, outcome });
      if (r.ok) toast.success(done);
      else toast.error(r.error);
    });
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => act('DISMISSED', 'Report dismissed')}
      >
        Dismiss
      </Button>
      {targetType !== 'PROFILE' && !targetGone && (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => act('CONTENT_REMOVED', 'Content removed')}
        >
          Remove {{ POST: 'post', COMMENT: 'comment', ARTICLE: 'article', PROFILE: '' }[targetType]}
        </Button>
      )}
      {!targetGone && (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => act('USER_SUSPENDED', 'Account suspended')}
        >
          Suspend author
        </Button>
      )}
    </div>
  );
}
