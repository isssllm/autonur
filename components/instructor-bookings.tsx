'use client';

import { useMemo, useState } from 'react';
import { ruPlace, ruStatus, ruTransmission } from '@/lib/data';
import LogoutButton from '@/components/logout-button';
import { StatusPill } from './admin-table';

type Row = {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  name: string;
  phone: string;
  car: string;
  transmission: 'AUTOMATIC' | 'MANUAL';
  place: 'CITY' | 'AUTODROME';
  status: 'NEW' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
};

export default function InstructorBookings({
  instructor,
  initial,
}: {
  instructor: string;
  initial: Row[];
}) {
  const [filter, setFilter] = useState('Все');
  const [date, setDate] = useState('');

  const rows = useMemo(
    () =>
      initial
        .filter((booking) => booking.status !== 'NEW')
        .filter((booking) => !date || booking.date === date)
        .filter((booking) => filter === 'Все' || booking.status === filter)
        .sort((a, b) => {
          const rank = (status: string) =>
            status === 'COMPLETED' ? 2 : status === 'CANCELLED' ? 1 : 0;
          const rankDiff = rank(a.status) - rank(b.status);
          return (
            rankDiff ||
            b.date.localeCompare(a.date) ||
            b.startHour - a.startHour
          );
        }),
    [initial, date, filter]
  );

  return (
    <main className="container-x py-10">
      <div className="mb-8">
        <div className="eyebrow">Инструктор</div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-semibold">{instructor}</h1>
            <p className="muted mt-2 text-sm">
              Только ваши записи. Можно посмотреть предыдущие, текущие и будущие занятия.
            </p>
          </div>
          <LogoutButton redirectTo="/" />
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-[220px_1fr]">
        <label>
          <span className="mb-2 block text-xs font-medium text-neutral-500">Дата</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="focus-ring w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-neutral-900"
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-medium text-neutral-500">Статус</span>
          <div className="flex flex-wrap gap-2">
            {['Все', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm ${
                  filter === value
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900'
                }`}
              >
                {value === 'Все' ? 'Все' : ruStatus(value as Row['status'])}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((booking) => (
          <article
            key={booking.id}
            className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium">
                {new Intl.DateTimeFormat('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(`${booking.date}T12:00:00Z`))}{' '}
                · {String(booking.startHour).padStart(2, '0')}:00–
                {String(booking.endHour).padStart(2, '0')}:00
              </div>
              <div className="mt-2 text-sm">Клиент: {booking.name}</div>
              <a
                href={`tel:${booking.phone.replace(/\D/g, '')}`}
                className="mt-1 block text-sm text-orange-600"
              >
                {booking.phone}
              </a>
              <div className="muted mt-1 text-sm">
                {booking.car} · {ruTransmission(booking.transmission)} · {ruPlace(booking.place)}
              </div>
            </div>
            <StatusPill status={ruStatus(booking.status)} />
          </article>
        ))}

        {!rows.length && (
          <div className="surface p-8 text-center text-sm text-neutral-500">
            Записей по выбранным условиям нет.
          </div>
        )}
      </div>
    </main>
  );
}
