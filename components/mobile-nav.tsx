'use client';
import Link from 'next/link';
import { Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
export default function MobileNav({ items, dashboardHref }: { items: string[][]; dashboardHref: string }) {
  const [open, setOpen] = useState(false);
  return <><button aria-label="Открыть меню" onClick={() => setOpen((v) => !v)} className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/80 md:hidden dark:border-white/10 dark:bg-neutral-900">{open ? <X size={18}/> : <Menu size={18}/>}</button>{open && <div className="absolute left-0 right-0 top-16 border-t border-black/5 bg-[#f7f6f3] p-4 shadow-soft dark:border-white/10 dark:bg-neutral-950 md:hidden"><nav className="container-x flex flex-col gap-1 px-0">{items.map(([label, href]) => <a onClick={() => setOpen(false)} key={href} href={href} className="rounded-2xl px-3 py-3 text-sm text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/5">{label}</a>)}<Link onClick={() => setOpen(false)} href={dashboardHref} className="flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold text-neutral-700 hover:bg-black/5 dark:text-neutral-200 dark:hover:bg-white/5"><UserRound size={16}/>Личный кабинет</Link></nav></div>}</>;
}
