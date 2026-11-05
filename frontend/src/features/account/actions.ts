'use server';

import { redirect } from 'next/navigation';
import { account, requireActor, runAction, supabaseServer } from '@tunetracker/backend';

export async function deleteAccountAction(confirmUsername: string) {
  const r = await runAction(async () => {
    await account.deleteAccount((await requireActor()).id, { confirmUsername });
    // the auth user is gone; clear the now-invalid session cookie
    await (await supabaseServer()).auth.signOut();
  });
  if (r.ok) redirect('/?account=deleted');
  return r;
}
