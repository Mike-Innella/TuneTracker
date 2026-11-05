import { Logo, LogoMark } from '@/components/brand/logo';

const credits = [
  ['Board', 'Your workflow, column by column'],
  ['Collaborators', 'Owner · editor · viewer'],
  ['Audio', 'Demos, stems and finished mixes'],
  ['Community', 'Feedback when you ask for it'],
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-stock lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="neon-bloom -top-24 -left-24 size-[28rem]" aria-hidden />
        <Logo />
        <div className="relative">
          <LogoMark size={112} className="mb-10 drop-shadow-[0_0_32px_rgb(58_107_255/0.45)]" />
          <p className="type-title text-5xl">
            Create.
            <br />
            Collaborate.
            <br />
            Share.
          </p>
          <dl className="mt-10 grid max-w-md gap-3">
            {credits.map(([role, name]) => (
              <div key={role} className="flex items-baseline gap-3">
                <dt className="type-role text-muted-foreground">{role}</dt>
                <span className="credit-leader" aria-hidden />
                <dd className="text-sm">{name}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="type-role relative text-ink-soft">Free for music creatives</p>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-10 lg:justify-center lg:px-16">
        <div className="mb-10 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
