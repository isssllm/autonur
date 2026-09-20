'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter(); const searchParams = useSearchParams(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError('');
    const form = new FormData(e.currentTarget); const payload = Object.fromEntries(form.entries());
    const res = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Не удалось выполнить действие.'); setBusy(false); return; }
    const requested = searchParams.get('next'); const safeNext = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : data.next; router.push(safeNext); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-4">
    {mode === 'register' && <div className="grid gap-4 sm:grid-cols-2"><Field name="firstName" label="Имя"/><Field name="lastName" label="Фамилия"/></div>}
    <Field name="phone" label="Телефон" type="tel" placeholder="+7 700 000 00 00"/>
    <Field name="password" label="Пароль" type="password" placeholder="Минимум 8 символов"/>
    {mode === 'register' && <Field name="confirmPassword" label="Подтвердите пароль" type="password"/>}
    {error && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/25 dark:text-red-300">{error}</div>}
    <button disabled={busy} className="focus-ring w-full rounded-full bg-orange-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
    {mode === 'login' && <Link href="/forgot-password" className="block text-center text-sm font-semibold text-orange-600">Забыли пароль?</Link>}
    {mode === 'login' ? <p className="muted text-center text-sm">Нет аккаунта? <Link className="font-semibold text-orange-600" href="/register">Регистрация</Link></p> : <p className="muted text-center text-sm">Уже есть аккаунт? <Link className="font-semibold text-orange-600" href="/login">Войти</Link></p>}
  </form>;
}
function Field({ name, label, type = 'text', placeholder = '' }: { name: string; label: string; type?: string; placeholder?: string }) { return <label className="block"><span className="mb-2 block text-sm font-medium">{label}</span><input name={name} required type={type} placeholder={placeholder} className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 outline-none dark:border-white/10 dark:bg-neutral-900"/></label>; }
