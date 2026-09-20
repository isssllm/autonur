'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ruPlace, ruStatus, ruTransmission } from '@/lib/data';

type Transmission = 'AUTOMATIC' | 'MANUAL';
type Place = 'CITY' | 'AUTODROME';
type Slot={id:string;date:string;hour:number;isFree:boolean;instructorId:string;instructor:string;carId:string;car:string;transmission:Transmission;place:Place;booking?:{id:string;name:string;phone:string;status:'NEW'|'CONFIRMED'|'COMPLETED'|'CANCELLED'}|null};
type InstructorOpt={id:string;name:string;transmission:Transmission[];places:Place[]};
type CarOpt={id:string;name:string;transmission:Transmission};

export default function ScheduleManager({city,instructors,cars,initial}:{city:string;instructors:InstructorOpt[];cars:CarOpt[];initial:Slot[]}){
  const router=useRouter();
  const today=new Date().toISOString().slice(0,10);
  const [date,setDate]=useState(today);
  const [slots,setSlots]=useState(initial);
  const [instructor,setInstructor]=useState('all');
  const [filter,setFilter]=useState('Все');
  const [error,setError]=useState('');
  const [form,setForm]=useState<{instructorId:string;carId:string;transmission:Transmission;place:Place;from:string;to:string;hourFrom:number;hourTo:number;weekdays:number[]}>({
    instructorId:instructors[0]?.id||'',
    carId:cars[0]?.id||'',
    transmission:cars[0]?.transmission||'AUTOMATIC',
    place:instructors[0]?.places?.[0]||'CITY',
    from:date,
    to:date,
    hourFrom:9,
    hourTo:18,
    weekdays:[1,2,3,4,5],
  });
  const [busy,setBusy]=useState(false);
  const [selected,setSelected]=useState<string[]>([]);
  const [editing,setEditing]=useState<Slot|null>(null);

  const formInstructors=useMemo(()=>instructors.filter(i=>i.transmission.includes(form.transmission)&&i.places.includes(form.place)),[instructors,form.transmission,form.place]);
  const formCars=useMemo(()=>cars.filter(c=>c.transmission===form.transmission),[cars,form.transmission]);

  useEffect(()=>{
    if(!formInstructors.some(i=>i.id===form.instructorId)) setForm(cur=>({...cur,instructorId:formInstructors[0]?.id||''}));
    if(!formCars.some(c=>c.id===form.carId)) setForm(cur=>({...cur,carId:formCars[0]?.id||''}));
  },[formInstructors,formCars,form.instructorId,form.carId]);

  async function reload(nextDate=date){
    setDate(nextDate);setBusy(true);setError('');
    const r=await fetch(`/api/admin/schedule?city=${encodeURIComponent(city)}&from=${nextDate}&to=${nextDate}`,{cache:'no-store'});
    const d=await r.json();
    if(r.ok){setSlots(d.slots);setSelected([])}else setError(d.error||'Ошибка');
    setBusy(false);
  }
  useEffect(()=>{void reload(date)},[]);

  function updateTransmission(next:Transmission){
    const nextCars=cars.filter(c=>c.transmission===next);
    const nextInstructors=instructors.filter(i=>i.transmission.includes(next)&&i.places.includes(form.place));
    setForm(cur=>({...cur,transmission:next,carId:nextCars[0]?.id||'',instructorId:nextInstructors.some(i=>i.id===cur.instructorId)?cur.instructorId:nextInstructors[0]?.id||''}));
  }
  function updatePlace(next:Place){
    const nextInstructors=instructors.filter(i=>i.transmission.includes(form.transmission)&&i.places.includes(next));
    setForm(cur=>({...cur,place:next,instructorId:nextInstructors.some(i=>i.id===cur.instructorId)?cur.instructorId:nextInstructors[0]?.id||''}));
  }

  async function create(){
    setBusy(true);setError('');
    const r=await fetch('/api/admin/schedule',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,city})});
    const d=await r.json();
    if(!r.ok)setError(d.error||'Ошибка создания');
    else {await reload(form.from);router.refresh();}
    setBusy(false);
  }
  async function remove(ids:string[],confirmText:string){
    if(!ids.length||!confirm(confirmText))return;
    setBusy(true);setError('');
    const r=await fetch('/api/admin/schedule',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({city,ids})});
    const d=await r.json();
    if(!r.ok)setError(d.error||'Ошибка удаления');else {setSelected(cur=>cur.filter(id=>!ids.includes(id)));await reload(date)}
    setBusy(false);
  }
  async function freeCancelled(id:string){
    setBusy(true);setError('');
    const r=await fetch('/api/admin/schedule',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({city,ids:[id]})});
    const d=await r.json();
    if(!r.ok)setError(d.error||'Ошибка освобождения');else await reload(date);
    setBusy(false);
  }
  async function saveEdit(slot:Slot){
    setBusy(true);setError('');
    const r=await fetch('/api/admin/schedule',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({city,slotId:slot.id,date:slot.date,hour:slot.hour,instructorId:slot.instructorId,carId:slot.carId,transmission:slot.transmission,place:slot.place})});
    const d=await r.json();
    if(!r.ok)setError(d.error||'Ошибка изменения');else{setEditing(null);await reload(date);router.refresh()}
    setBusy(false);
  }
  const visible=useMemo(()=>slots.filter(s=>instructor==='all'||s.instructorId===instructor).filter(s=>filter==='Все'||(filter==='Свободные'&&s.isFree)||(filter==='Занятые'&&!s.isFree)||(filter==='Подтверждённые'&&s.booking?.status==='CONFIRMED')||(filter==='Завершённые'&&s.booking?.status==='COMPLETED')||(filter==='Отменённые'&&s.booking?.status==='CANCELLED')),[slots,instructor,filter]);
  const allVisibleSelected=visible.length>0&&visible.every(s=>selected.includes(s.id));

  return <div className="space-y-6">
    <div className="surface p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <Field label="Дата" type="date" value={date} onChange={v=>void reload(v)}/>
        <Select label="Инструктор" value={instructor} onChange={setInstructor} options={[["all","Все инструкторы"],...instructors.map(i=>[i.id,i.name])]}/>
        <Select label="Фильтр" value={filter} onChange={setFilter} options={['Все','Свободные','Занятые','Подтверждённые','Завершённые','Отменённые'].map(v=>[v,v])}/>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={()=>setSelected(allVisibleSelected?[]:visible.map(s=>s.id))} className="rounded-full border px-3 py-2 text-xs">{allVisibleSelected?'Снять выбор':'Выбрать все'}</button>
        {selected.length>0&&<button type="button" disabled={busy} onClick={()=>{const selectedRows=slots.filter(s=>selected.includes(s.id));const occupied=selectedRows.filter(s=>!s.isFree);const free=selectedRows.filter(s=>s.isFree);const occupiedText=occupied.map(s=>`${s.hour.toString().padStart(2,'0')}:00 — ${s.booking?.name||'клиент'}`).join(', ');const text=occupied.length?`Удалить выбранные слоты? Занятые: ${occupiedText}. Их записи будут отменены, а слоты освобождены.`:`Удалить ${free.length} свободных слотов?`;void remove(selected,text)}} className="rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white">Удалить выбранные ({selected.length})</button>}
        <span className="muted text-xs">Выбрано: {selected.length}</span>
      </div>
    </div>

    <div className="surface p-5 sm:p-6">
      <div className="eyebrow">Добавить свободные часы</div>
      <h2 className="mt-2 text-xl font-semibold">Создать расписание</h2>
      <p className="muted mt-1 text-sm">Дубликаты автоматически пропускаются; существующие слоты не изменяются.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="КПП" value={form.transmission} onChange={v=>updateTransmission(v as Transmission)} options={[["AUTOMATIC","Автомат"],["MANUAL","Механика"]]}/>
        <Select label="Инструктор" value={form.instructorId} onChange={v=>setForm({...form,instructorId:v})} options={formInstructors.map(i=>[i.id,i.name])}/>
        <Select label="Автомобиль" value={form.carId} onChange={v=>setForm({...form,carId:v})} options={formCars.map(i=>[i.id,i.name])}/>
        <Select label="Место" value={form.place} onChange={v=>updatePlace(v as Place)} options={[["CITY","Езда по городу"],["AUTODROME","Автодром"]]}/>
        <Field label="С первого часа" type="number" value={String(form.hourFrom)} onChange={v=>setForm({...form,hourFrom:Number(v)})}/>
        <Field label="До часа" type="number" value={String(form.hourTo)} onChange={v=>setForm({...form,hourTo:Number(v)})}/>
        <Field label="Период с" type="date" value={form.from} onChange={v=>setForm({...form,from:v})}/>
        <Field label="Период по" type="date" value={form.to} onChange={v=>setForm({...form,to:v})}/>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{[['Пн',1],['Вт',2],['Ср',3],['Чт',4],['Пт',5],['Сб',6],['Вс',0]].map(([label,v])=><button key={String(v)} type="button" onClick={()=>setForm({...form,weekdays:form.weekdays.includes(Number(v))?form.weekdays.filter(x=>x!==Number(v)):[...form.weekdays,Number(v)]})} className={`rounded-full px-3 py-2 text-xs font-medium ${form.weekdays.includes(Number(v))?'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300':'border border-black/10 dark:border-white/10'}`}>{label}</button>)}</div>
      <button type="button" disabled={busy||!form.instructorId||!form.carId} onClick={create} className="mt-5 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?'Сохраняем…':'Создать свободные часы'}</button>
    </div>

    {error&&<div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/25 dark:text-red-300">{error}</div>}

    <div className="surface overflow-hidden">
      <div className="border-b border-black/5 p-5 dark:border-white/10"><div className="font-semibold">Расписание на {date}</div><div className="muted mt-1 text-sm">{visible.length} слотов</div></div>
      <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-sm"><thead className="bg-black/[.025] text-xs text-neutral-500 dark:bg-white/[.035]"><tr><th className="px-4 py-3">Выбор</th><th className="px-4 py-3">Время</th><th className="px-4 py-3">Инструктор</th><th className="px-4 py-3">Автомобиль</th><th className="px-4 py-3">КПП</th><th className="px-4 py-3">Место</th><th className="px-4 py-3">Состояние</th><th className="px-4 py-3">Действие</th></tr></thead><tbody className="divide-y divide-black/5 dark:divide-white/10">{visible.map(s=><tr key={s.id}><td className="px-4 py-4"><input aria-label={`Выбрать ${s.hour}:00`} type="checkbox" checked={selected.includes(s.id)} onChange={e=>setSelected(cur=>e.target.checked?[...cur,s.id]:cur.filter(id=>id!==s.id))}/></td><td className="px-4 py-4 font-medium">{String(s.hour).padStart(2,'0')}:00</td><td className="px-4 py-4">{s.instructor}</td><td className="px-4 py-4">{s.car}</td><td className="px-4 py-4">{ruTransmission(s.transmission)}</td><td className="px-4 py-4">{ruPlace(s.place)}</td><td className="px-4 py-4">{s.isFree?'Свободно':s.booking?`${ruStatus(s.booking.status)} · ${s.booking.name}`:'Занято'}</td><td className="px-4 py-4">{s.isFree?<div className="flex gap-2"><button type="button" onClick={()=>setEditing(s)} className="rounded-full border px-3 py-1.5 text-xs">Открыть</button><button type="button" disabled={busy} onClick={()=>void remove([s.id],`Удалить свободный слот ${String(s.hour).padStart(2,'0')}:00?`)} className="rounded-full border px-3 py-1.5 text-xs">Удалить</button></div>:s.booking?.status==='CANCELLED'?<button type="button" disabled={busy} onClick={()=>void freeCancelled(s.id)} className="rounded-full border border-orange-200 px-3 py-1.5 text-xs text-orange-700 dark:border-orange-900 dark:text-orange-300">Сделать свободным</button>:s.booking?.status==='NEW'||s.booking?.status==='CONFIRMED'?<button type="button" disabled={busy} onClick={()=>void remove([s.id],`На ${date}, ${String(s.hour).padStart(2,'0')}:00 записан ${s.booking?.name||'клиент'}. Удалить слот и отменить всю запись?`)} className="rounded-full border border-red-200 px-3 py-1.5 text-xs text-red-700 dark:border-red-900 dark:text-red-300">Удалить и отменить</button>:<span className="text-xs text-neutral-400">Завершена</span>}</td></tr>)}</tbody></table></div>
    </div>

    {editing&&<EditSlotModal slot={editing} instructors={instructors} cars={cars} busy={busy} error={error} setEditing={setEditing} saveEdit={saveEdit}/>} 
  </div>
}

function EditSlotModal({slot,instructors,cars,busy,error,setEditing,saveEdit}:{slot:Slot;instructors:InstructorOpt[];cars:CarOpt[];busy:boolean;error:string;setEditing:(slot:Slot|null)=>void;saveEdit:(slot:Slot)=>void}){
  const [draft,setDraft]=useState(slot);
  const availableInstructors=instructors.filter(i=>i.transmission.includes(draft.transmission)&&i.places.includes(draft.place));
  const availableCars=cars.filter(c=>c.transmission===draft.transmission);
  function changeTransmission(next:Transmission){
    const nextCars=cars.filter(c=>c.transmission===next);const nextInstructors=instructors.filter(i=>i.transmission.includes(next)&&i.places.includes(draft.place));
    setDraft(cur=>({...cur,transmission:next,carId:nextCars.some(c=>c.id===cur.carId)?cur.carId:nextCars[0]?.id||'',instructorId:nextInstructors.some(i=>i.id===cur.instructorId)?cur.instructorId:nextInstructors[0]?.id||''}));
  }
  function changePlace(next:Place){
    const nextInstructors=instructors.filter(i=>i.transmission.includes(draft.transmission)&&i.places.includes(next));
    setDraft(cur=>({...cur,place:next,instructorId:nextInstructors.some(i=>i.id===cur.instructorId)?cur.instructorId:nextInstructors[0]?.id||''}));
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="surface max-h-[90vh] w-full max-w-lg overflow-auto p-6"><div className="flex items-start justify-between"><div><div className="eyebrow">Свободный слот</div><h2 className="mt-2 text-xl font-semibold">Изменить слот</h2></div><button type="button" onClick={()=>setEditing(null)} className="rounded-full border px-3 py-2 text-sm">Закрыть</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Дата" type="date" value={draft.date} onChange={v=>setDraft({...draft,date:v})}/><Field label="Час" type="number" value={String(draft.hour)} onChange={v=>setDraft({...draft,hour:Number(v)})}/><Select label="КПП" value={draft.transmission} onChange={v=>changeTransmission(v as Transmission)} options={[["AUTOMATIC","Автомат"],["MANUAL","Механика"]]}/><Select label="Инструктор" value={draft.instructorId} onChange={v=>setDraft({...draft,instructorId:v})} options={availableInstructors.map(i=>[i.id,i.name])}/><Select label="Автомобиль" value={draft.carId} onChange={v=>setDraft({...draft,carId:v})} options={availableCars.map(i=>[i.id,i.name])}/><Select label="Место" value={draft.place} onChange={v=>changePlace(v as Place)} options={[["CITY","Езда по городу"],["AUTODROME","Автодром"]]}/></div>{error&&<div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/25 dark:text-red-300">{error}</div>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setEditing(null)} className="rounded-full border px-4 py-2 text-sm">Назад</button><button type="button" disabled={busy||!draft.instructorId||!draft.carId} onClick={()=>void saveEdit(draft)} className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white">{busy?'Сохраняем…':'Сохранить'}</button></div></div></div>
}

function Field({label,type,value,onChange}:{label:string;type:string;value:string;onChange:(v:string)=>void}){return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900"/></label>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[][]}){return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900">{options.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>}
