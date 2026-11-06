'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Flag, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { RichText } from './rich-text';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserAvatar } from '@/components/ui/user-avatar';
import { SectionHeading } from '@/components/layout/page-header';
import {
  addCommentAction,
  deleteCommentAction,
  deletePostAction,
  reportAction,
} from '@/features/community/actions';
import { timeAgo } from '@/lib/format';

type Comment = {
  id: string;
  body: string;
  createdAt: Date;
  isMine: boolean;
  author: { username: string; displayName: string; avatarUrl: string | null };
};

type ThreadedComment = Comment & { replies: Comment[] };

export function CommentsSection({
  postId,
  comments,
  postIsMine,
  feedbackRequested,
}: {
  postId: string;
  comments: ThreadedComment[];
  postIsMine: boolean;
  feedbackRequested: boolean;
}) {
  const total = comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  return (
    <section id="comments" className="mt-10" aria-labelledby="comments-h">
      <SectionHeading>
        <span id="comments-h">
          {feedbackRequested ? 'Feedback' : 'Comments'} <span className="type-figure">{total}</span>
        </span>
      </SectionHeading>
      <CommentForm
        postId={postId}
        placeholder={
          feedbackRequested
            ? 'What works? What would you change in the mix or arrangement?'
            : 'Say something kind and specific — @mention collaborators'
        }
      />
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet — be the first.</p>
      ) : (
        <ul className="grid gap-6">
          {comments.map((c) => (
            <CommentItem key={c.id} postId={postId} comment={c} postIsMine={postIsMine}>
              {c.replies.length > 0 && (
                <ul
                  className="mt-4 grid gap-4 border-l border-rule pl-4"
                  aria-label={`Replies to ${c.author.displayName}`}
                >
                  {c.replies.map((r) => (
                    <CommentItem
                      key={r.id}
                      postId={postId}
                      comment={r}
                      postIsMine={postIsMine}
                      replyTo={c.id}
                    />
                  ))}
                </ul>
              )}
            </CommentItem>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentForm({
  postId,
  parentId,
  placeholder,
  autoFocus,
  onDone,
}: {
  postId: string;
  parentId?: string;
  placeholder: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const fieldId = parentId ? `reply-${parentId}` : 'comment-body';
  return (
    <form
      className={parentId ? 'mt-3 grid gap-2' : 'mb-8 grid gap-2'}
      onSubmit={(e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const body = String(new FormData(formEl).get('body') ?? '').trim();
        if (!body) return;
        start(async () => {
          const r = await addCommentAction(postId, body, parentId);
          if (r.ok) {
            formEl.reset();
            onDone?.();
          } else toast.error(r.error);
        });
      }}
    >
      <label htmlFor={fieldId} className="sr-only">
        {parentId ? 'Your reply' : 'Your comment'}
      </label>
      <Textarea
        id={fieldId}
        name="body"
        rows={parentId ? 2 : 3}
        maxLength={4000}
        autoFocus={autoFocus}
        placeholder={placeholder}
      />
      <div className="flex gap-2">
        <Button type="submit" size={parentId ? 'sm' : 'default'} disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} {parentId ? 'Reply' : 'Post comment'}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  postId,
  comment: c,
  postIsMine,
  replyTo,
  children,
}: {
  postId: string;
  comment: Comment;
  postIsMine: boolean;
  /** replies answer the top-level comment, so the thread stays one level deep */
  replyTo?: string;
  children?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const [replying, setReplying] = useState(false);
  return (
    <li className="flex gap-3" data-testid="comment" id={`comment-${c.id}`}>
      <Link href={`/artists/${c.author.username}`} className="shrink-0">
        <UserAvatar name={c.author.displayName} url={c.author.avatarUrl} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link href={`/artists/${c.author.username}`} className="font-semibold hover:underline">
            {c.author.displayName}
          </Link>{' '}
          <span className="type-figure text-xs text-ink-soft">{timeAgo(c.createdAt)}</span>
        </p>
        <p className="mt-1 text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap">
          <RichText text={c.body} />
        </p>
        <button
          type="button"
          className="type-role mt-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setReplying((v) => !v)}
          aria-expanded={replying}
        >
          Reply
        </button>
        {replying && (
          <CommentForm
            postId={postId}
            parentId={replyTo ?? c.id}
            placeholder={`Reply to ${c.author.displayName}`}
            autoFocus
            onDone={() => setReplying(false)}
          />
        )}
        {children}
      </div>
      {c.isMine || postIsMine ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete comment"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await deleteCommentAction(postId, c.id);
              if (!r.ok) toast.error(r.error);
            })
          }
        >
          <X aria-hidden />
        </Button>
      ) : (
        <ReportButton targetType="COMMENT" targetId={c.id} compact />
      )}
    </li>
  );
}

export function PostOwnerActions({ postId }: { postId: string }) {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 aria-hidden /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            The post, its comments and reactions are removed. Your uploaded audio stays in your library.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() =>
              start(async () => {
                const r = await deletePostAction(postId);
                if (r && !r.ok) toast.error(r.error);
              })
            }
          >
            Delete post
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReportButton({
  targetType,
  targetId,
  compact,
}: {
  targetType: 'POST' | 'COMMENT' | 'PROFILE' | 'ARTICLE';
  targetId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon-sm" aria-label="Report comment">
            <Flag aria-hidden />
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            <Flag aria-hidden /> Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>
            Tell us what’s wrong — harassment, spam, or music you believe infringes copyright. Reports are
            private.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get('reason') ?? '');
            start(async () => {
              const r = await reportAction({ targetType, targetId, reason });
              if (r.ok) {
                toast.success('Thanks — we’ll review this report.');
                setOpen(false);
              } else toast.error(r.error);
            });
          }}
        >
          <label htmlFor="report-reason" className="sr-only">
            Reason
          </label>
          <Textarea id="report-reason" name="reason" rows={4} minLength={5} maxLength={1000} required />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Send report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
