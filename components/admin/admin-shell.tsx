import type { ReactNode } from 'react';
import Link from 'next/link';
import { CalendarClock, CarFront, ClipboardList, Menu, Tag, UserRound, Users, X, MapPinned, Shield } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Logo from '@/components/logo';
import ThemeProvider from '@/components/theme-provider';
import LogoutButton from '@/components/logout-button';
import StaffCitySelect from './staff-city-select';
import StaffMobileMenu from './staff-mobile-menu';

const adminNav = [['/admin','Записи',ClipboardList],['/admin/users','Пользователи',Users],['/admin/instructors','Инструкторы',UserRound],['/admin/cars','Автомобили',CarFront],['/admin/managers','Менеджеры',Shield],['/admin/cities','Города',MapPinned],['/admin/schedule','Расписание',CalendarClock],['/admin/prices','Цены',Tag]] as const;
const managerNav = [['/admin','Записи',ClipboardList],['/admin/users','Пользователи',Users],['/admin/schedule','Расписание',CalendarClock]] as const;

export default async function AdminShell({ children, citySlug, currentPath }: { children:ReactNode; citySlug?:string; currentPath:string }) {
  const user=await getCurrentUser(); if(!user || !['ADMIN','MANAGER'].includes(user.role)) redirect('/login');
  const effectiveCitySlug = user.role==='MANAGER' ? (await prisma.city.findUnique({where:{id:user.cityId||''}}))?.slug : citySlug;
  if(!effectiveCitySlug) redirect('/admin/select-city');
  const nav=user.role==='ADMIN'?adminNav:managerNav;
  const withCity=(href:string)=>`${href}?city=${effectiveCitySlug}`;
  return <div className="min-h-screen bg-[#f4f3f0] dark:bg-[#0b0b0b]"><header className="sticky top-0 z-40 border-b border-black/5 bg-[#f4f3f0]/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b0b]/90"><div className="flex h-16 items-center gap-3 px-4 sm:px-6"><StaffMobileMenu items={nav.map(([href,label])=>[withCity(href),label])}/><Logo/><div className="ml-auto flex items-center gap-2"><StaffCitySelect value={effectiveCitySlug} disabled={user.role==='MANAGER'}/><div className="hidden items-center gap-2 px-2 text-xs text-neutral-500 lg:flex"><span className="h-2 w-2 rounded-full bg-orange-500"/>{user.role==='ADMIN'?'Администратор':'Менеджер'}</div><ThemeProvider/><div className="hidden lg:block"><LogoutButton/></div></div></div></header><div className="flex"><aside className="hidden min-h-[calc(100vh-64px)] w-64 shrink-0 border-r border-black/5 bg-white p-4 md:block dark:border-white/10 dark:bg-neutral-950"><div className="mb-4 rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/20"><div className="text-xs text-orange-700 dark:text-orange-300">Текущий город</div><div className="mt-1 font-semibold">{(await prisma.city.findUnique({where:{slug:effectiveCitySlug}}))?.name}</div></div><nav className="space-y-1">{nav.map(([href,label,Icon])=><Link key={href} href={withCity(href)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${currentPath===href?'bg-black text-white dark:bg-white dark:text-black':'text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5'}`}><Icon size={17}/>{label}</Link>)}</nav><div className="mt-5 lg:hidden"><LogoutButton/></div></aside><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div></div>;
}
