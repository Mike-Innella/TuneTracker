'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { BLOG_CATEGORIES } from '@tunetracker/shared';
import { ProjectArtwork } from '@/components/dashboard/project-artwork';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { deleteArticleAction, saveArticleAction, setArticlePublishedAction } from '@/features/blog/actions';
import { uploadFile } from '@/features/media/upload';
import { cn } from '@/lib/utils';

export type EditableArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  bodyHtml: string;
  category: string;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  coverId: string | null;
  coverUrl: string | null;
};

const select =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring';

/** Write, save as draft, publish. The server sanitizes the HTML; this only shapes it. */
export function ArticleEditor({ initial }: { initial?: EditableArticle }) {
  const router = useRouter();
  const [article, setArticle] = useState(initial ?? null);
  const [cover, setCover] = useState({ id: initial?.coverId ?? null, url: initial?.coverUrl ?? null });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto'] },
      }),
    ],
    content: initial?.bodyHtml ?? '',
    immediatelyRender: false, // server-rendered page: mount the editor on the client only
    shouldRerenderOnTransaction: true, // keep the toolbar's pressed states current
    editorProps: {
      attributes: {
        class: 'prose-article min-h-72 px-4 py-3 outline-none',
        'aria-label': 'Article body',
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
  });

  function values() {
    const f = Object.fromEntries(new FormData(formRef.current!)) as Record<string, string>;
    return {
      title: f.title ?? '',
      excerpt: f.excerpt || null,
      category: f.category as (typeof BLOG_CATEGORIES)[number],
      tags: (f.tags ?? '')
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      coverId: cover.id,
      bodyHtml: editor?.getHTML() ?? '',
    };
  }

  /** Saves, then optionally publishes or unpublishes. New articles move to their edit URL. */
  function save(then?: 'publish' | 'unpublish') {
    start(async () => {
      const r = await saveArticleAction(article?.id ?? null, values());
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error);
        return;
      }
      setErrors({});
      if (then) {
        const p = await setArticlePublishedAction(r.data.id, then === 'publish');
        if (!p.ok) {
          toast.error(p.error);
          return;
        }
        if (then === 'publish') {
          toast.success('Published');
          router.push(`/blog/${p.data.slug}`);
          return;
        }
        setArticle((a) => a && { ...a, status: 'DRAFT' });
        toast.success('Moved back to drafts');
        return;
      }
      toast.success('Draft saved');
      if (!article) router.replace(`/studio/articles/${r.data.id}`);
      setArticle((a) => a ?? { ...values(), ...r.data, status: 'DRAFT', coverUrl: cover.url });
    });
  }

  async function onCover(file: File | undefined) {
    if (!file) return;
    try {
      const asset = await uploadFile(file, { kind: 'IMAGE', visibility: 'public' });
      setCover({ id: asset.id, url: asset.url });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      if (coverRef.current) coverRef.current.value = '';
    }
  }

  return (
    <form
      ref={formRef}
      className="mx-auto grid max-w-3xl gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Field id="title" label="Title" error={errors.title}>
        {(p) => <Input {...p} name="title" required maxLength={160} defaultValue={initial?.title} />}
      </Field>
      <Field
        id="excerpt"
        label="Summary"
        hint="Optional — shown in lists. Up to 300 characters."
        error={errors.excerpt}
      >
        {(p) => (
          <Textarea {...p} name="excerpt" rows={2} maxLength={300} defaultValue={initial?.excerpt ?? ''} />
        )}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="category" label="Category" error={errors.category}>
          {(p) => (
            <select
              {...p}
              name="category"
              defaultValue={initial?.category ?? BLOG_CATEGORIES[0]}
              className={select}
            >
              {BLOG_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field id="tags" label="Tags" hint="Comma separated, up to 10" error={errors.tags}>
          {(p) => <Input {...p} name="tags" defaultValue={initial?.tags.join(', ')} />}
        </Field>
      </div>
      <div className="flex items-center gap-4">
        {cover.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- public bucket URL
          <img src={cover.url} alt="Cover" className="h-20 w-32 rounded-md object-cover" />
        ) : (
          <ProjectArtwork title={initial?.title ?? 'Article'} className="h-20 w-32 text-lg" />
        )}
        <input
          ref={coverRef}
          id="article-cover"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => onCover(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" onClick={() => coverRef.current?.click()}>
          {cover.url ? 'Replace cover' : 'Add cover'}
        </Button>
        {cover.url && (
          <Button type="button" variant="ghost" onClick={() => setCover({ id: null, url: null })}>
            Remove
          </Button>
        )}
      </div>

      <div className="rounded-md border border-input bg-stock-2 focus-within:outline-2 focus-within:outline-ring">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      {errors.bodyHtml && <p className="text-sm text-destructive">{errors.bodyHtml[0]}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {article ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await deleteArticleAction(article.id);
                if (!r.ok) toast.error(r.error);
                else router.push('/studio');
              })
            }
          >
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {article?.status === 'PUBLISHED' ? (
            <>
              <Button type="button" variant="outline" disabled={pending} onClick={() => save('unpublish')}>
                Unpublish
              </Button>
              <Button type="button" disabled={pending} onClick={() => save('publish')}>
                {pending && <Loader2 className="animate-spin" aria-hidden />} Save changes
              </Button>
            </>
          ) : (
            <>
              <Button type="submit" variant="outline" disabled={pending}>
                Save draft
              </Button>
              <Button type="button" disabled={pending} onClick={() => save('publish')}>
                {pending && <Loader2 className="animate-spin" aria-hidden />} Publish
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState('');
  if (!editor) return <div className="h-11 border-b border-border" aria-hidden />;
  const c = () => editor.chain().focus();
  const tools = [
    ['Bold', Bold, () => c().toggleBold().run(), editor.isActive('bold')],
    ['Italic', Italic, () => c().toggleItalic().run(), editor.isActive('italic')],
    ['Strikethrough', Strikethrough, () => c().toggleStrike().run(), editor.isActive('strike')],
    [
      'Heading',
      Heading2,
      () => c().toggleHeading({ level: 2 }).run(),
      editor.isActive('heading', { level: 2 }),
    ],
    [
      'Subheading',
      Heading3,
      () => c().toggleHeading({ level: 3 }).run(),
      editor.isActive('heading', { level: 3 }),
    ],
    ['Bulleted list', List, () => c().toggleBulletList().run(), editor.isActive('bulletList')],
    ['Numbered list', ListOrdered, () => c().toggleOrderedList().run(), editor.isActive('orderedList')],
    ['Quote', Quote, () => c().toggleBlockquote().run(), editor.isActive('blockquote')],
    ['Code', Code, () => c().toggleCode().run(), editor.isActive('code')],
  ] as const;
  return (
    <div className="border-b border-border">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 p-1.5">
        {tools.map(([label, Icon, run, active]) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={active}
            onClick={run}
            className={cn(
              'grid size-8 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground',
              active && 'bg-accent text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        ))}
        <button
          type="button"
          aria-label="Link"
          aria-pressed={editor.isActive('link')}
          aria-expanded={linking}
          onClick={() => {
            setHref(editor.getAttributes('link').href ?? 'https://');
            setLinking((v) => !v);
          }}
          className={cn(
            'grid size-8 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground',
            editor.isActive('link') && 'bg-accent text-foreground',
          )}
        >
          <Link2 className="size-4" aria-hidden />
        </button>
        <span className="mx-1 w-px bg-border" aria-hidden />
        <button
          type="button"
          aria-label="Undo"
          onClick={() => c().undo().run()}
          className="grid size-8 place-items-center rounded-sm text-muted-foreground hover:bg-muted"
        >
          <Undo2 className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Redo"
          onClick={() => c().redo().run()}
          className="grid size-8 place-items-center rounded-sm text-muted-foreground hover:bg-muted"
        >
          <Redo2 className="size-4" aria-hidden />
        </button>
      </div>
      {linking && (
        <div className="flex gap-2 border-t border-border p-2">
          <Input
            aria-label="Link address"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="h-8"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const url = href.trim();
              if (!url || url === 'https://') c().extendMarkRange('link').unsetLink().run();
              else c().extendMarkRange('link').setLink({ href: url }).run();
              setLinking(false);
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
