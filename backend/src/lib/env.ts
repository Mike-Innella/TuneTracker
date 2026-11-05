function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export const env = {
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  /** URL the server uses to reach Supabase (differs inside Docker). */
  supabaseInternalUrl: () => process.env.SUPABASE_INTERNAL_URL || required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};
