import Link from 'next/link';

export default function Footer() {
  return <footer className="border-t border-black/5 py-10 dark:border-white/10"><div className="container-x flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold">Autonur</div><p className="muted mt-1 text-sm">Практические занятия по вождению</p></div><div className="flex flex-wrap gap-4 text-sm text-neutral-500"><Link href="/">Главная</Link><a href="/#cities">Города</a><a href="/#faq">FAQ</a><a href="/#contacts">Контакты</a></div><div className="text-sm text-neutral-500">© 2026 Autonur</div></div></footer>;
}
