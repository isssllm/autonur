'use client';
import { useRouter } from 'next/navigation';
import { cities } from '@/lib/data';
export default function StaffCitySelect({ value, disabled }: { value: string; disabled?: boolean }) { const router=useRouter(); return <select aria-label="Выбрать рабочий город" disabled={disabled} value={value} onChange={e=>router.push(`/admin?city=${e.target.value}`)} className="focus-ring rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-medium outline-none disabled:opacity-70 dark:border-white/10 dark:bg-neutral-900">{cities.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select> }
