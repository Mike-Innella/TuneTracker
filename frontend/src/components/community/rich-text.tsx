import Link from 'next/link';
import { splitMentions } from '@tunetracker/shared';

/** Plain text with @mentions linked to artist pages. No HTML is ever interpreted. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitMentions(text).map((p, i) =>
        'text' in p ? (
          p.text
        ) : (
          <Link key={i} href={`/artists/${p.mention}`} className="font-medium text-electric hover:underline">
            @{p.mention}
          </Link>
        ),
      )}
    </>
  );
}
