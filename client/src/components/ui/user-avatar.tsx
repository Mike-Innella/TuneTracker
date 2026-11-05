import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function UserAvatar({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <Avatar className={cn('size-8 border border-border', className)}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback className="type-role bg-secondary text-[0.65rem] text-secondary-foreground">
        {initials || '?'}
      </AvatarFallback>
    </Avatar>
  );
}
