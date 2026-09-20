import Link from 'next/link';
import { Menu, UserRound, X } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import Logo from './logo';
import ThemeProvider from './theme-provider';
import MobileNav from './mobile-nav';

export default async function SiteHeader({ city }: { city?: string }) {
  const user = await getCurrentUser();
  const items = city ? [['Инструкторы', '#instructors'], ['Автомобили', '#cars'], ['Запись', '#booking'], ['Адрес', '#address'], ['FAQ', '#faq'], ['Контакты', '#contacts']] : [['Преимущества', '#advantages'], ['Как проходят занятия', '#steps'], ['Города', '#cities'], ['FAQ', '#faq'], ['Контакты', '#contacts']];
  const dashboardHref = !user ? '/login' : user.role === 'INSTRUCTOR' ? '/instructor' : user.role === 'ADMIN' ? '/admin/select-city' : user.role === 'MANAGER' ? '/admin' : '/account';
  return <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f7f6f3]/90 backdrop-blur-xl dark:border-white/5 dark:bg-neutral-950/90">
    <div className="container-x flex h-16 items-center justify-between gap-4">
      <Logo/>
      <nav className="hidden items-center gap-6 text-sm text-neutral-600 md:flex dark:text-neutral-300">{items.map(([label, href]) => <a key={href} href={href} className="transition hover:text-black dark:hover:text-white">{label}</a>)}</nav>
      <div className="flex items-center gap-2"><ThemeProvider/><Link href={dashboardHref} aria-label={user ? 'Личный кабинет' : 'Войти'} className="focus-ring hidden h-10 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 text-sm font-medium sm:flex dark:border-white/10 dark:bg-neutral-900"><UserRound size={17}/>{user ? `${user.firstName}` : 'Войти'}</Link><MobileNav items={items} dashboardHref={dashboardHref}/></div>
    </div>
  </header>;
}
