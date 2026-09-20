'use client';
import { useRouter } from 'next/navigation';
import { cities } from '@/lib/data';

export default function CitySwitcher({ current }: { current: string }) {
  const router = useRouter();
  return <select aria-label="Выбрать город" value={current} onChange={(e) => router.push(`/${e.target.value}#booking`)} className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none dark:border-white/10 dark:bg-neutral-900">
    {cities.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
  </select>;
}
