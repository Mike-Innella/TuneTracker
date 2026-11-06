import Link from 'next/link';
import { ExternalLink, MessageSquare, MessageSquareQuote } from 'lucide-react';
import type { FeedPost } from '@tunetracker/backend';
import { AudioPlayer } from '@/components/audio/audio-player';
import { UserAvatar } from '@/components/ui/user-avatar';
import { formatDate, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Reactions } from './reactions';
import { RichText } from './rich-text';

export const POST_TYPE_LABEL: Record<string, string> = {
  PROGRESS: 'Work in progress',
  FINISHED: 'Finished',
  SAMPLE: 'Sample',
  FEEDBACK: 'Feedback wanted',
};

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** A post set like a single's sleeve: credits line, title, audio, then the notes. */
export function PostCard({ post, full = false }: { post: FeedPost; full?: boolean }) {
  return (
    <article className="sheet overflow-hidden" data-testid="post-card" aria-labelledby={`post-${post.id}`}>
      <header className="flex items-center gap-3 px-5 pt-5">
        <Link href={`/artists/${post.author.username}`} className="shrink-0">
          <UserAvatar name={post.author.displayName} url={post.author.avatarUrl} className="size-10" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            <Link href={`/artists/${post.author.username}`} className="font-semibold hover:underline">
              {post.author.displayName}
            </Link>{' '}
            <span className="text-muted-foreground">@{post.author.username}</span>
          </p>
          <p className="type-role mt-0.5 text-muted-foreground">
            <time
              dateTime={new Date(post.createdAt).toISOString()}
              title={formatDate(post.createdAt, { dateStyle: 'medium' })}
            >
              {timeAgo(post.createdAt)}
            </time>
            {' · '}
            {POST_TYPE_LABEL[post.type]}
            {post.genre && ` · ${post.genre}`}
          </p>
        </div>
        {post.feedbackRequested && (
          <span className="type-role inline-flex shrink-0 items-center gap-1 rounded-full border border-electric/50 px-2.5 py-1 text-electric">
            <MessageSquareQuote className="size-3" aria-hidden /> Feedback
          </span>
        )}
      </header>

      <div className="px-5 pt-4">
        <h2 id={`post-${post.id}`} className="type-title text-xl break-words sm:text-2xl">
          {full ? (
            post.title
          ) : (
            <Link href={`/community/${post.id}`} className="hover:text-electric">
              {post.title}
            </Link>
          )}
        </h2>
        {post.project && (
          <p className="type-role mt-1.5 text-muted-foreground">
            from{' '}
            <Link href={`/showcase/${post.project.id}`} className="text-foreground hover:underline">
              {post.project.title}
            </Link>
          </p>
        )}
      </div>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- user media
        <img
          src={post.imageUrl}
          alt=""
          className="mt-4 max-h-[28rem] w-full border-y border-border object-cover"
          loading="lazy"
        />
      )}

      <div className="grid gap-4 px-5 py-4">
        {post.audio && (
          <AudioPlayer
            id={post.audio.trackId ?? post.audio.id}
            trackId={post.audio.trackId ?? undefined}
            artist={post.author.displayName}
            src={post.audio.url}
            title={post.audio.title ?? post.title}
            durationSec={post.audio.durationSec}
          />
        )}
        {!post.audio && post.track && (
          <div className="grid gap-1.5" data-testid="track-embed">
            <AudioPlayer
              id={post.track.id}
              trackId={post.track.id}
              artist={post.author.displayName}
              src={post.track.url}
              title={post.track.title}
              durationSec={post.track.durationSec}
            />
            <Link
              href={`/tracks/${post.track.id}`}
              className="type-role justify-self-end text-muted-foreground hover:text-foreground"
            >
              Open track →
            </Link>
          </div>
        )}
        <p
          className={cn(
            'text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap',
            !full && 'line-clamp-4',
          )}
        >
          <RichText text={post.body} />
        </p>
        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {post.tags.map((t) => (
              <li
                key={t}
                className="type-role rounded-sm bg-muted px-2 py-1 text-[0.66rem] text-muted-foreground"
              >
                #{t}
              </li>
            ))}
          </ul>
        )}
        {post.links.length > 0 && (
          <ul className="grid gap-1">
            {post.links.map((l) => (
              <li key={l}>
                <a
                  href={l}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="inline-flex items-center gap-1.5 text-sm text-electric hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden /> {hostOf(l)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
        <Reactions postId={post.id} counts={post.reactionCounts} mine={post.myReactions} />
        {!full && (
          <Link
            href={`/community/${post.id}#comments`}
            className="inline-flex h-9 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="size-4" aria-hidden />
            <span className="type-figure">{post.commentCount}</span>
            <span className="sr-only">comments</span>
          </Link>
        )}
      </footer>
    </article>
  );
}
