import type { ReactNode } from 'react';
import Link from 'next/link';
import Logo from './logo';
import ThemeProvider from './theme-provider';
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <div className="min-h-screen"><div className="container-x flex items-center justify-between py-6"><Logo/><ThemeProvider/></div><main className="container-x flex min-h-[calc(100vh-96px)] items-center justify-center pb-16"><div className="surface w-full max-w-md p-6 sm:p-8"><h1 className="text-2xl font-semibold">{title}</h1><p className="muted mt-2 text-sm leading-6">{subtitle}</p><div className="mt-7">{children}</div><Link href="/" className="muted mt-6 block text-center text-sm hover:text-black dark:hover:text-white">← Вернуться на главную</Link></div></main></div>; }
