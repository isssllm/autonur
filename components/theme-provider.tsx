'use client';
import { useEffect, useState } from 'react';
export default function ThemeProvider() {
  const [dark, setDark] = useState(false);
  useEffect(() => { const saved = localStorage.getItem('autonur-theme'); const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches; const next = saved ? saved === 'dark' : prefers; setDark(next); document.documentElement.classList.toggle('dark', next); }, []);
  function toggle() { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('autonur-theme', next ? 'dark' : 'light'); }
  return <button aria-label="Переключить тему" onClick={toggle} className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/80 text-sm dark:border-white/10 dark:bg-neutral-900">{dark ? '☀' : '☾'}</button>;
}
