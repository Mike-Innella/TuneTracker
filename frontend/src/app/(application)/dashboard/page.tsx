import { redirect } from 'next/navigation';

/** The dashboard became Studio; old links and bookmarks keep working. */
export default function DashboardPage() {
  redirect('/studio');
}
