'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cities } from '@/lib/data';
export default function CityPicker() {
  const router = useRouter();
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  async function choose(slug:string){
    setBusy(slug);setError('');
    const r=await fetch('/api/account/city',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({citySlug:slug})});
    const d=await r.json();
    if(r.ok){router.push(d.next);return;}
    setError(d.error||'Не удалось сохранить город.');setBusy('');
  }
  return <div>{error&&<div role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/25 dark:text-red-300">{error}</div>}<div className="grid gap-3 sm:grid-cols-3">{cities.map(c=><button type="button" key={c.slug} onClick={()=>choose(c.slug)} disabled={busy!==''} className="surface overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-soft disabled:opacity-60"><img src={c.hero} alt={c.name} className="aspect-[4/3] w-full object-cover"/><div className="p-5"><div className="text-xl font-semibold">{c.name}</div><div className="muted mt-2 text-sm">{busy===c.slug?'Сохраняем…':'Открыть город →'}</div></div></button>)}</div></div>;
}
