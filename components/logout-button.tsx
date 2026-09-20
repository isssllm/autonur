'use client';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
export default function LogoutButton({ compact = false, redirectTo = '/' }: { compact?: boolean; redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() { setBusy(true); await fetch('/api/auth/logout', { method: 'POST' }); router.push(redirectTo); router.refresh(); }
  return <button disabled={busy} onClick={logout} className={`${compact ? 'w-full justify-center' : ''} focus-ring inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold transition hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5`}><LogOut size={14}/>{busy ? 'Выходим…' : 'Выйти'}</button>;
}
