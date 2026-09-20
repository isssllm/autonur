import { notFound } from 'next/navigation';
import { ArrowRight, MapPin } from 'lucide-react';
import SiteHeader from '@/components/site-header';
import Footer from '@/components/footer';
import SectionTitle from '@/components/section-title';
import Instructors from '@/components/instructors';
import CityCars from '@/components/city-cars';
import FAQ from '@/components/faq';
import BookingWizard from '@/components/booking-wizard';
import CitySwitcher from '@/components/city-switcher';
import { cityBySlug, cities, type CitySlug } from '@/lib/data';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export function generateStaticParams() { return cities.map(c => ({ city: c.slug })); }

export default async function CityPage({ params }: { params: Promise<{ city: CitySlug }> }) {
  const { city: slug } = await params;
  if (!['astana','kokshetau','karaganda'].includes(slug)) notFound();
  const fallback = cityBySlug(slug);
  const city = await prisma.city.findUnique({ where: { slug } });
  const dbCity = city || { id: '', slug, name: fallback.name, autodrome: fallback.autodrome, gisUrl: fallback.gis, phone: fallback.phone };
  const [instructors, cars, manager] = dbCity.id ? await Promise.all([
    prisma.instructor.findMany({ where: { cityId: dbCity.id }, orderBy: { firstName: 'asc' } }),
    prisma.car.findMany({ where: { cityId: dbCity.id }, orderBy: { name: 'asc' } }),
    prisma.manager.findFirst({ where: { cityId: dbCity.id }, select: { phone: true } }),
  ]) : [[], [], null];
  const contactPhone = manager?.phone || dbCity.phone;
  return <div className="min-h-screen"><SiteHeader city={slug}/><main>
    <section className="container-x pt-6 sm:pt-10"><div className="relative min-h-[560px] overflow-hidden rounded-[2rem] bg-neutral-950 text-white shadow-2xl"><img src={fallback.hero} alt={dbCity.name} className="absolute inset-0 h-full w-full object-cover opacity-65"/><div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/15"/><div className="relative flex min-h-[560px] items-end p-6 sm:p-10 lg:p-14"><div className="max-w-2xl"><div className="eyebrow text-orange-300">Город · Autonur</div><h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">Autonur — {dbCity.name}</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">Практические занятия с профессиональными инструкторами.</p><a href="#booking" className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-sm font-semibold">Записаться <ArrowRight size={17}/></a></div></div></div></section>
    <section id="instructors" className="section"><div className="container-x"><SectionTitle eyebrow="Команда" title="Инструкторы" description="Выбирайте специалиста по опыту, коробке и доступному формату занятия."/><div className="mt-10"><Instructors items={instructors.map(i=>({id:i.id,firstName:i.firstName,lastName:i.lastName,experience:i.experience,transmission:i.transmission,photo:i.photo}))}/></div></div></section>
    <section id="cars" className="section bg-white/60 dark:bg-white/[.02]"><div className="container-x"><SectionTitle eyebrow="Автопарк" title="Наши автомобили" description="Карточки можно листать свайпом на телефоне и стрелками на большом экране."/><div className="mt-10"><CityCars items={cars}/></div></div></section>
    <section id="booking" className="section"><div className="container-x grid gap-8 lg:grid-cols-[.76fr_1.24fr]"><div className="lg:sticky lg:top-24 lg:self-start"><SectionTitle eyebrow="Запись" title="Подберите занятие под себя" description="Выберите коробку, место, дату, время, инструктора и автомобиль. Система проверит свободные часы перед созданием записи."/><div className="mt-7 rounded-3xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-neutral-950"><div className="muted mb-3 text-xs uppercase tracking-wider">Ваш город</div><CitySwitcher current={slug}/></div></div><BookingWizard city={slug} cityName={dbCity.name}/></div></section>
    <section id="address" className="section bg-white/60 dark:bg-white/[.02]"><div className="container-x grid gap-8 lg:grid-cols-[1fr_.7fr]"><div><SectionTitle eyebrow="Место" title="Автодром"/><div className="surface mt-8 flex items-start gap-4 p-6"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-300"><MapPin size={19}/></div><div><div className="font-medium">{dbCity.autodrome}</div><a href={dbCity.gisUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-orange-600">Открыть в 2GIS <ArrowRight size={14} className="ml-1"/></a></div></div></div><div className="rounded-3xl bg-neutral-950 p-7 text-white"><div className="eyebrow text-orange-400">Связь</div><div className="mt-3 text-xl font-semibold">Менеджер {dbCity.name}</div><p className="mt-2 text-sm leading-6 text-white/60">По вопросам записи, отмены, переноса и оплаты.</p><div className="mt-6 flex flex-wrap gap-2"><a href={`tel:${contactPhone.replace(/\D/g,'')}`} className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold">Позвонить</a><a href={`https://wa.me/${contactPhone.replace(/\D/g,'')}`} className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold">WhatsApp</a></div></div></div></section>
    <section id="faq" className="section"><div className="container-x grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><SectionTitle eyebrow="FAQ" title="Вопросы по занятиям"/><FAQ/></div></section>
    <section id="contacts" className="section"><div className="container-x"><div className="surface p-7 sm:p-10"><div className="eyebrow">Контакты</div><div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold">Есть вопросы?</h2><p className="muted mt-2">Свяжитесь с менеджером {dbCity.name}.</p></div><div className="flex flex-wrap gap-3"><a href={`tel:${contactPhone.replace(/\D/g,'')}`} className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white">Позвонить</a><a href={`https://wa.me/${contactPhone.replace(/\D/g,'')}`} className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/10">WhatsApp</a><a href="https://instagram.com/autonur" target="_blank" rel="noreferrer" className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/10">Instagram</a></div></div></div></div></section>
  </main><Footer/></div>;
}
