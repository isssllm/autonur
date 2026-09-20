'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export type PriceRow={id:string;instructorId:string;instructor:string;place:'CITY'|'AUTODROME';hourlyPrice:number;active:boolean};
type InstructorOption={id:string;name:string;places:('CITY'|'AUTODROME')[]};
export default function PricesManager({city,initial,instructors}:{city:string;initial:PriceRow[];instructors:InstructorOption[]}){
  const router=useRouter();
  const [rows,setRows]=useState(initial);
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(initial.map(p=>[`${p.instructorId}:${p.place}`,String(p.hourlyPrice)])));
  const [newInstructor,setNewInstructor]=useState(instructors[0]?.id||'');
  const [newPlace,setNewPlace]=useState<'CITY'|'AUTODROME'>(instructors[0]?.places?.[0]||'CITY');
  const [newPrice,setNewPrice]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const placesForNew=instructors.find(i=>i.id===newInstructor)?.places||[];
  function makeKey(instructorId:string,place:'CITY'|'AUTODROME'){return `${instructorId}:${place}`;}
  async function save(p:PriceRow){
    const value=Number(values[makeKey(p.instructorId,p.place)]);
    setBusy(p.id);setError('');
    const r=await fetch('/api/admin/prices',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({city,instructorId:p.instructorId,place:p.place,hourlyPrice:value})});
    const d=await r.json();
    if(!r.ok){setError(d.error||'Ошибка');setBusy('');return;}
    setRows(cur=>cur.map(x=>x.id===p.id?{...x,hourlyPrice:value}:x));
    setBusy('');router.refresh();
  }
  async function create(){
    const value=Number(newPrice);
    if(!newInstructor||!newPlace||!Number.isInteger(value)||value<=0){setError('Укажите инструктора, место и корректную цену.');return;}
    setBusy('new');setError('');
    const r=await fetch('/api/admin/prices',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({city,instructorId:newInstructor,place:newPlace,hourlyPrice:value})});
    const d=await r.json();
    if(!r.ok){setError(d.error||'Ошибка');setBusy('');return;}
    const instructor=instructors.find(i=>i.id===newInstructor);
    setRows(cur=>{const key=makeKey(newInstructor,newPlace);const row:PriceRow={id:d.price.id,instructorId:newInstructor,instructor:instructor?.name||'Инструктор',place:newPlace,hourlyPrice:value,active:true};return cur.some(x=>makeKey(x.instructorId,x.place)===key)?cur.map(x=>makeKey(x.instructorId,x.place)===key?row:x):[...cur,row].sort((a,b)=>a.instructor.localeCompare(b.instructor)||a.place.localeCompare(b.place));});
    setValues(cur=>({...cur,[makeKey(newInstructor,newPlace)]:String(value)}));
    setNewPrice('');setBusy('');router.refresh();
  }
  function chooseInstructor(id:string){setNewInstructor(id);const places=instructors.find(i=>i.id===id)?.places||[];if(!places.includes(newPlace))setNewPlace(places[0]||'CITY');}
  return <div className="space-y-5">
    {error&&<div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/25 dark:text-red-300">{error}</div>}
    <div className="surface p-5 sm:p-6"><div className="eyebrow">Новая цена</div><h2 className="mt-2 text-xl font-semibold">Добавить или создать тариф</h2><p className="muted mt-1 text-sm">Цена задаётся за один час и зависит от инструктора и места занятия.</p><div className="mt-5 grid gap-4 sm:grid-cols-3"><label><span className="mb-2 block text-sm font-medium">Инструктор</span><select value={newInstructor} onChange={e=>chooseInstructor(e.target.value)} className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900">{instructors.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label><span className="mb-2 block text-sm font-medium">Место</span><select value={newPlace} onChange={e=>setNewPlace(e.target.value as 'CITY'|'AUTODROME')} className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900">{(['CITY','AUTODROME'] as const).filter(v=>placesForNew.includes(v)).map(v=><option key={v} value={v}>{v==='CITY'?'Езда по городу':'Автодром'}</option>)}</select></label><label><span className="mb-2 block text-sm font-medium">Цена за час</span><input inputMode="numeric" value={newPrice} onChange={e=>setNewPrice(e.target.value.replace(/\D/g,''))} placeholder="6000" className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900"/></label></div><button disabled={busy==='new'} onClick={create} className="mt-4 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy==='new'?'Сохраняем…':'Сохранить цену'}</button></div>
    {rows.map(p=>{const key=makeKey(p.instructorId,p.place);return <div key={key} className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold">{p.instructor}</div><div className="muted mt-1 text-sm">{p.place==='CITY'?'Езда по городу':'Автодром'}</div><div className="muted mt-1 text-xs">Изменение не влияет на уже созданные записи.</div></div><div className="flex items-center gap-2"><div className="relative"><input aria-label="Цена за час" value={values[key]??String(p.hourlyPrice)} onChange={e=>setValues({...values,[key]:e.target.value.replace(/\D/g,'')})} className="focus-ring w-32 rounded-2xl border border-black/10 bg-white px-4 py-3 pr-10 text-right dark:border-white/10 dark:bg-neutral-900"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₸</span></div><button disabled={busy===p.id} onClick={()=>save(p)} className="rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy===p.id?'…':'Сохранить'}</button></div></div>})}
  </div>;
}
