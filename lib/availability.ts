import 'server-only';
import { LessonPlace, Transmission } from '@prisma/client';
import { prisma } from './prisma';
import { almatyNow, almatyTodayKey, dateKey } from './validation';

export async function getAvailableStarts(cityId: string, date: Date, transmission: Transmission, place: LessonPlace) {
  const slots = await prisma.scheduleSlot.findMany({
    where: { cityId, date, transmission, place, isFree: true },
    select: { hour: true },
    orderBy: { hour: 'asc' },
  });
  const today = almatyTodayKey();
  const key = dateKey(date);
  if (key < today) return [];
  const current = almatyNow();
  const minimumHour = key === today ? current.getUTCHours() + (current.getUTCMinutes() === 0 ? 0 : 1) : 0;
  return [...new Set(slots.map((slot) => slot.hour).filter((hour) => hour >= minimumHour))];
}

export async function getAvailableEnds(cityId: string, date: Date, startHour: number, transmission: Transmission, place: LessonPlace) {
  const slots = await prisma.scheduleSlot.findMany({
    where: { cityId, date, transmission, place, isFree: true, hour: { gte: startHour } },
    select: { hour: true, instructorId: true, carId: true },
    orderBy: [{ instructorId: 'asc' }, { carId: 'asc' }, { hour: 'asc' }],
  });
  const byPair = new Map<string, Set<number>>();
  for (const slot of slots) {
    const key = `${slot.instructorId}:${slot.carId}`;
    if (!byPair.has(key)) byPair.set(key, new Set());
    byPair.get(key)!.add(slot.hour);
  }
  const ends = new Set<number>();
  for (const hours of byPair.values()) {
    for (let end = startHour + 1; end <= 24; end += 1) {
      let all = true;
      for (let h = startHour; h < end; h += 1) if (!hours.has(h)) { all = false; break; }
      if (all) ends.add(end); else break;
    }
  }
  return [...ends].sort((a, b) => a - b);
}

export async function getCompatibleChoices(cityId: string, date: Date, startHour: number, endHour: number, transmission: Transmission, place: LessonPlace) {
  const slots = await prisma.scheduleSlot.findMany({
    where: { cityId, date, transmission, place, isFree: true, hour: { gte: startHour, lt: endHour } },
    include: { instructor: true, car: true },
    orderBy: [{ instructor: { firstName: 'asc' } }],
  });
  const expected = endHour - startHour;
  const grouped = new Map<string, { instructor: typeof slots[number]['instructor']; car: typeof slots[number]['car']; count: number }>();
  for (const slot of slots) {
    const key = `${slot.instructorId}:${slot.carId}`;
    const entry = grouped.get(key) ?? { instructor: slot.instructor, car: slot.car, count: 0 };
    entry.count += 1;
    grouped.set(key, entry);
  }
  const valid = [...grouped.values()].filter((entry) => entry.count === expected);
  return {
    instructors: [...new Map(valid.map((entry) => [entry.instructor.id, entry.instructor])).values()],
    cars: valid.map((entry) => entry.car),
    pairs: valid.map((entry) => ({ instructor: entry.instructor, car: entry.car })),
  };
}
