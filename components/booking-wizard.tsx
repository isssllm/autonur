'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, Clock3, MapPin, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LessonPlace, Transmission } from '@/lib/data';

const pad = (n:number)=>String(n).padStart(2,'0');
const prettyTime=(h:number)=>`${pad(h)}:00`;
const prettyDate=(value:string)=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
const ruTransmission=(v:Transmission)=>v==='AUTOMATIC'?'Автомат':'Механика';
const ruPlace=(v:LessonPlace)=>v==='CITY'?'Езда по городу':'Автодром';

type Instructor = { id:string; name:string; experience:number; phone:string; carId:string|null };
type Car = { id:string; name:string; year:number; transmission:Transmission };

type Choices = { starts:number[]; ends:number[]; dates:string[]; instructors:Instructor[]; cars:Car[]; pairs:{instructorId:string;carId:string}[]; prices:Record<string,number> };

export default function BookingWizard({ city, cityName }: { city:string; cityName:string }) {
  const router = useRouter();
  const [step,setStep]=useState(1);
  const [transmission,setTransmission]=useState<Transmission>('AUTOMATIC');
  const [place,setPlace]=useState<LessonPlace>('CITY');
  const [date,setDate]=useState('');
  const [start,setStart]=useState<number|null>(null);
  const [end,setEnd]=useState<number|null>(null);
  const [instructorId,setInstructorId]=useState('');
  const [carId,setCarId]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState(false);
  const [choices,setChoices]=useState<Choices>({dates:[],starts:[],ends:[],instructors:[],cars:[],pairs:[],prices:{}});

  async function load(params:Record<string,string>) {
    setLoading(true); setError('');
    try {
      const query = new URLSearchParams({city,transmission,place,...params});
      const response = await fetch(`/api/bookings/availability?${query.toString()}`, { cache:'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить свободное время.');
      setChoices(prev=>({ ...prev, dates:data.dates ?? prev.dates, starts:data.starts ?? prev.starts, ends:data.ends ?? prev.ends, instructors:data.instructors ?? prev.instructors, cars:data.cars ?? prev.cars, pairs:data.pairs ?? prev.pairs, prices:data.prices ?? prev.prices }));
    } catch(e) { setError(e instanceof Error ? e.message : 'Не удалось загрузить варианты.'); } finally { setLoading(false); }
  }

  useEffect(()=>{
    setDate(''); setStart(null); setEnd(null); setInstructorId(''); setCarId('');
    void load({});
    // Changing the first two choices intentionally resets downstream selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[transmission,place,city]);

  useEffect(()=>{ if(step===4 && date) void load({date}); },[step,date]);
  useEffect(()=>{ if(step===5 && date && start!==null) void load({date,start:String(start)}); },[step,date,start]);
  useEffect(()=>{ if(step===6 && date && start!==null && end!==null) void load({date,start:String(start),end:String(end)}); },[step,date,start,end]);

  const duration = start!==null && end!==null ? end-start : 0;
  const hourly = instructorId ? choices.prices[instructorId] ?? 0 : 0;
  const total = duration * hourly;
  const selectedInstructor=choices.instructors.find(i=>i.id===instructorId);
  const availableCars=choices.cars.filter(c=>choices.pairs.some(p=>p.instructorId===instructorId && p.carId===c.id));
  const canNext = useMemo(()=>({1:true,2:true,3:!!date,4:start!==null,5:end!==null,6:!!instructorId,7:!!carId,8:true} as Record<1|2|3|4|5|6|7|8,boolean>)[step as 1|2|3|4|5|6|7|8],[step,date,start,end,instructorId,carId]);
  const titles=['Какую коробку вы предпочитаете?','Где будет проходить занятие?','Выберите дату занятия','Во сколько начнём?','До какого времени?','Выберите инструктора','Выберите автомобиль','Проверьте вашу запись'];

  function chooseTransmission(value:Transmission){setTransmission(value);}
  function choosePlace(value:LessonPlace){setPlace(value);}
  function goNext(){ if(!canNext || loading) return; if(step===8){void createBooking();return;} setError(''); setStep(s=>Math.min(8,s+1)); }
  function goBack(){ if(step===1)return; setError(''); setStep(s=>s-1); }
  async function createBooking(){
    setLoading(true); setError('');
    const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({citySlug:city,date,startHour:start,endHour:end,instructorId,carId,transmission,place})});
    const data=await response.json();
    setLoading(false);
    if(response.status===401){ router.push(`/login?next=/${city}#booking`); return; }
    if(!response.ok){setError(data.error||'Эти часы уже заняли. Выберите другое время.');return;}
    setSuccess(true);
  }

  if(success) return <div className="surface p-7 text-center sm:p-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-500 text-white"><Check/></div><h3 className="mt-5 text-2xl font-semibold">Запись успешно создана!</h3><p className="muted mx-auto mt-3 max-w-md leading-7">Менеджер вашего города свяжется с вами для уточнения оплаты.</p><div className="mx-auto mt-6 max-w-md rounded-2xl bg-black/[.03] p-5 text-left text-sm dark:bg-white/[.04]"><div className="font-medium">{prettyDate(date)} · {prettyTime(start!)}–{prettyTime(end!)}</div><div className="muted mt-2">{cityName} · {ruTransmission(transmission)} · {ruPlace(place)}</div><div className="muted mt-1">{selectedInstructor?.name} · {choices.cars.find(c=>c.id===carId)?.name}</div><div className="mt-3 font-semibold">{total.toLocaleString('ru-RU')} ₸</div></div></div>;

  return <div className="surface overflow-hidden"><div className="border-b border-black/5 p-5 sm:p-7 dark:border-white/10"><div className="flex items-center justify-between gap-4"><div><div className="eyebrow">Шаг {step} из 8</div><h3 className="mt-2 text-xl font-semibold sm:text-2xl">{titles[step-1]}</h3></div><div className="text-right text-xs text-neutral-500">{loading?'Загрузка…':`${Math.round((step/8)*100)}%`}</div></div><div className="mt-5 grid grid-cols-8 gap-1.5">{Array.from({length:8},(_,i)=><div key={i} className={`h-1.5 rounded-full ${i<step?'bg-orange-500':'bg-black/10 dark:bg-white/10'}`}/>)}</div></div>
    <div className="p-5 sm:p-7">
      {step===1 && <div className="grid gap-3 sm:grid-cols-2">{(['AUTOMATIC','MANUAL'] as Transmission[]).map(v=><Choice key={v} selected={transmission===v} icon={<CarFront size={18}/>} title={ruTransmission(v)} onClick={()=>chooseTransmission(v)}/>)}</div>}
      {step===2 && <div className="grid gap-3 sm:grid-cols-2">{(['CITY','AUTODROME'] as LessonPlace[]).map(v=><Choice key={v} selected={place===v} icon={<MapPin size={18}/>} title={ruPlace(v)} onClick={()=>choosePlace(v)}/>)}</div>}
      {step===3 && <DateChoices values={choices.dates} value={date} onChoose={(v)=>{setDate(v);setStart(null);setEnd(null);setInstructorId('');setCarId('');}}/>}
      {step===4 && <HourChoices values={choices.starts} value={start} onChoose={(v)=>{setStart(v);setEnd(null);setInstructorId('');setCarId('');}}/>}
      {step===5 && <HourChoices values={choices.ends} value={end} onChoose={(v)=>{setEnd(v);setInstructorId('');setCarId('');}} prefix="До "/>}
      {step===6 && <div className="space-y-3">{choices.instructors.map(i=><button key={i.id} type="button" onClick={()=>{setInstructorId(i.id);setCarId('');}} className={`focus-ring flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${instructorId===i.id?'border-orange-500 bg-orange-50 dark:bg-orange-950/20':'border-black/10 bg-white hover:border-orange-300 dark:border-white/10 dark:bg-neutral-900'}`}><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${instructorId===i.id?'bg-orange-500 text-white':'bg-black/5 dark:bg-white/10'}`}><UserRound size={18}/></div><div className="min-w-0 flex-1"><div className="font-medium">{i.name}</div><div className="muted mt-1 text-sm">Опыт: {i.experience} лет</div></div><div className="text-right"><div className="text-sm font-semibold">{(choices.prices[i.id]??0).toLocaleString('ru-RU')} ₸/ч</div><div className="muted mt-1 text-xs">Свободен на весь период</div></div></button>)}{!loading && choices.instructors.length===0 && <Empty text="На выбранный период подходящих инструкторов нет. Вернитесь назад и выберите другое время."/>}</div>}
      {step===7 && <div className="space-y-3">{availableCars.map(c=><button key={c.id} type="button" onClick={()=>setCarId(c.id)} className={`focus-ring flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${carId===c.id?'border-orange-500 bg-orange-50 dark:bg-orange-950/20':'border-black/10 bg-white hover:border-orange-300 dark:border-white/10 dark:bg-neutral-900'}`}><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${carId===c.id?'bg-orange-500 text-white':'bg-black/5 dark:bg-white/10'}`}><CarFront size={18}/></div><div className="min-w-0 flex-1"><div className="font-medium">{c.name}</div><div className="muted mt-1 text-sm">{ruTransmission(c.transmission)} · {c.year}</div></div></button>)}{!loading && availableCars.length===0 && <Empty text="Под этот период и инструктора свободного автомобиля нет."/>}</div>}
      {step===8 && <div className="space-y-3"><SummaryRow label="Город" value={cityName}/><SummaryRow label="Место" value={ruPlace(place)}/><SummaryRow label="Коробка" value={ruTransmission(transmission)}/><SummaryRow label="Дата" value={prettyDate(date)}/><SummaryRow label="Время" value={`${prettyTime(start!)}–${prettyTime(end!)}`}/><SummaryRow label="Инструктор" value={selectedInstructor?.name||'—'}/><SummaryRow label="Автомобиль" value={choices.cars.find(c=>c.id===carId)?.name||'—'}/><div className="mt-5 rounded-2xl bg-neutral-950 p-5 text-white"><div className="text-sm text-white/60">Стоимость</div><div className="mt-2 text-2xl font-semibold">{hourly.toLocaleString('ru-RU')} ₸/ч × {duration} ч. = {total.toLocaleString('ru-RU')} ₸</div></div></div>}
      {error && <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700 dark:bg-red-950/25 dark:text-red-300">{error}</div>}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={goBack} disabled={step===1||loading} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold disabled:opacity-40 dark:border-white/10"><ArrowLeft size={16}/>Назад</button><button type="button" onClick={goNext} disabled={!canNext||loading} className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{step===8?(loading?'Проверяем…':'Подтвердить запись'):'Далее'}{step<8&&<ArrowRight size={16}/>}</button></div>
    </div>
  </div>;
}

function Choice({selected,icon,title,onClick}:{selected:boolean;icon:ReactNode;title:string;onClick:()=>void}){return <button type="button" onClick={onClick} className={`focus-ring rounded-2xl border p-5 text-left transition ${selected?'border-orange-500 bg-orange-50 dark:bg-orange-950/20':'border-black/10 bg-white hover:border-orange-300 dark:border-white/10 dark:bg-neutral-900'}`}><span className={`grid h-10 w-10 place-items-center rounded-xl ${selected?'bg-orange-500 text-white':'bg-black/5 dark:bg-white/10'}`}>{icon}</span><div className="mt-4 font-semibold">{title}</div>{selected&&<div className="mt-2 text-xs text-orange-600">Выбрано</div>}</button>}
function DateChoices({values,value,onChoose}:{values:string[];value:string;onChoose:(v:string)=>void}){if(!values.length)return <Empty text="Пока нет свободных дат. Менеджер ещё не создал свободные часы на ближайший период."/>;return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{values.map(v=><button key={v} type="button" onClick={()=>onChoose(v)} className={`focus-ring rounded-2xl border p-4 text-left ${value===v?'border-orange-500 bg-orange-50 dark:bg-orange-950/20':'border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900'}`}><div className="flex items-center gap-3"><CalendarDays size={17} className="text-orange-500"/><span className="font-medium">{prettyDate(v)}</span></div></button>)}</div>}
function HourChoices({values,value,onChoose,prefix='' }:{values:number[];value:number|null;onChoose?:(v:number)=>void;prefix?:string}){if(!values.length)return <Empty text="В выбранное время нет подходящих свободных часов. Вернитесь назад и выберите другое время."/>;return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{values.map(v=><button key={v} type="button" onClick={()=>onChoose?.(v)} className={`focus-ring rounded-2xl border p-5 text-center ${value===v?'border-orange-500 bg-orange-50 dark:bg-orange-950/20':'border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900'}`}><Clock3 size={18} className="mx-auto text-orange-500"/><div className="mt-2 font-semibold">{prefix}{prettyTime(v)}</div></button>)}</div>}
function SummaryRow({label,value}:{label:string;value:string}){return <div className="flex flex-col gap-1 rounded-2xl bg-black/[.03] p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-white/[.04]"><span className="muted text-sm">{label}</span><span className="text-sm font-medium sm:text-right">{value}</span></div>}
function Empty({text}:{text:string}){return <div className="rounded-2xl border border-dashed border-black/10 p-7 text-center text-sm leading-6 text-neutral-500 dark:border-white/10 dark:text-neutral-400">{text}</div>}
