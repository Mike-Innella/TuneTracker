'use server';

import { revalidatePath } from 'next/cache';
import { resetPasswordSchema, type ProfileInput } from '@tunetracker/shared';
import { AppError, profiles, requireActor, runAction, supabaseServer } from '@tunetracker/backend';

export async function updateProfileAction(input: ProfileInput) {
  return runAction(async () => {
    await profiles.updateProfile((await requireActor()).id, input);
    revalidatePath('/', 'layout');
  });
}

export async function setAvatarAction(assetId: string | null) {
  return runAction(async () => {
    await profiles.setAvatar((await requireActor()).id, assetId);
    revalidatePath('/', 'layout');
  });
}

export async function setThemeAction(theme: string) {
  return runAction(async () => {
    await profiles.setTheme((await requireActor()).id, theme);
  });
}

export async function changePasswordAction(password: string) {
  return runAction(async () => {
    await requireActor();
    const parsed = resetPasswordSchema.parse({ password });
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.updateUser({ password: parsed.password });
    if (error) throw new AppError(400, error.message);
  });
}
