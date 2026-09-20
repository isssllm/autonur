import type { ReactNode } from 'react';
import Link from 'next/link';
import { CalendarDays, UserRound } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Logo from './logo';
import ThemeProvider from './theme-provider';
import LogoutButton from './logout-button';
export default async function AccountShell({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'USER') redirect('/login');
  return <div className="min-h-screen"><header className="border-b border-black/5 dark:border-white/10"><div className="container-x flex h-16 items-center justify-between gap-3"><Logo/><div className="flex items-center gap-2"><ThemeProvider/><LogoutButton redirectTo={user.city ? `/${user.city.slug}` : '/'}/></div></div></header><div className="container-x grid gap-7 py-8 lg:grid-cols-[230px_1fr]"><aside className="surface h-fit p-2"><div className="border-b border-black/5 px-3 py-3 dark:border-white/10"><div className="font-semibold">{user.firstName} {user.lastName}</div><div className="muted mt-1 text-xs">{user.phone}</div></div><nav className="mt-2 space-y-1"><Link href="/account" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/5"><CalendarDays size={17}/>Кабинет</Link><Link href="/account/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/5"><UserRound size={17}/>Профиль</Link></nav></aside><main className="min-w-0">{children}</main></div></div>;
}
