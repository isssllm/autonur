'use client';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { faqs } from '@/lib/data';

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return <div className="surface overflow-hidden divide-y divide-black/5 dark:divide-white/10">{faqs.map(([q, a], i) => <button key={q} onClick={() => setOpen(open === i ? null : i)} className="w-full px-5 py-5 text-left sm:px-6"><div className="flex items-center justify-between gap-5"><span className="font-medium">{q}</span><ChevronDown className={`shrink-0 transition-transform ${open === i ? 'rotate-180 text-orange-500' : ''}`} size={18}/></div>{open === i && <p className="muted mt-3 max-w-3xl pr-8 text-sm leading-6">{a}</p>}</button>)}</div>;
}
