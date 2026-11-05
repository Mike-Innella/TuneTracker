'use client';

import { useState, useTransition } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/ui/form-message';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteAccountAction } from '@/features/account/actions';

export function DeleteAccount({ username }: { username: string }) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <AlertDialog onOpenChange={(o) => !o && (setTyped(''), setError(null))}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 aria-hidden /> Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your profile, the projects you own (with their boards and files), your
            posts, comments, reactions, follows and uploads. Projects you collaborate on stay with their
            owners. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await deleteAccountAction(typed);
              if (r && !r.ok) setError(r.error);
            });
          }}
        >
          {error && <FormMessage>{error}</FormMessage>}
          <label htmlFor="confirm-username" className="text-sm">
            Type <span className="type-figure font-semibold">{username}</span> to confirm
          </label>
          <Input
            id="confirm-username"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my account</AlertDialogCancel>
            <Button
              type="submit"
              disabled={pending || typed !== username}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />} Delete forever
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
