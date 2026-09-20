import { NextResponse } from 'next/server';
import { LessonPlace, Transmission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dateOnly, isHourInFutureForAlmaty } from '@/lib/validation';
import { getAvailableStarts, getAvailableEnds, getCompatibleChoices } from '@/lib/availability';

async function cityBySlug(slug: string) {
  return prisma.city.findUnique({ where: { slug } });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const citySlug = url.searchParams.get('city') || '';
    const transmission = url.searchParams.get('transmission') as Transmission;
    const place = url.searchParams.get('place') as LessonPlace;
    const dateValue = url.searchParams.get('date') || '';
    const startValue = url.searchParams.get('start');
    const endValue = url.searchParams.get('end');
    if (!Object.values(Transmission).includes(transmission) || !Object.values(LessonPlace).includes(place)) return NextResponse.json({ error: 'Некорректные параметры.' }, { status: 400 });
    const city = await cityBySlug(citySlug);
    if (!city) return NextResponse.json({ error: 'Город не найден.' }, { status: 404 });

    if (!dateValue) {
      const todayKey = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const today = dateOnly(todayKey)!;
      const slots = await prisma.scheduleSlot.findMany({ where: { cityId: city.id, transmission, place, isFree: true, date: { gte: today } }, select: { date: true }, orderBy: { date: 'asc' }, distinct: ['date'] });
      const dates = [];
      for (const row of slots) {
        if ((await getAvailableStarts(city.id, row.date, transmission, place)).length) dates.push(row.date.toISOString().slice(0, 10));
      }
      return NextResponse.json({ dates });
    }

    const date = dateOnly(dateValue);
    if (!date) return NextResponse.json({ error: 'Некорректная дата.' }, { status: 400 });
    if (!startValue) return NextResponse.json({ starts: await getAvailableStarts(city.id, date, transmission, place) });
    const start = Number(startValue);
    if (!Number.isInteger(start) || start < 0 || start > 23 || !isHourInFutureForAlmaty(date, start)) return NextResponse.json({ error: 'Это время уже прошло.' }, { status: 400 });
    if (!endValue) return NextResponse.json({ ends: await getAvailableEnds(city.id, date, start, transmission, place) });
    const end = Number(endValue);
    if (!Number.isInteger(end) || end <= start || end > 24) return NextResponse.json({ error: 'Некорректный интервал.' }, { status: 400 });
    const choices = await getCompatibleChoices(city.id, date, start, end, transmission, place);
    const prices = await prisma.price.findMany({ where: { cityId: city.id, instructorId: { in: choices.instructors.map((i) => i.id) }, place, active: true } });
    const priceMap = new Map(prices.map((p) => [p.instructorId, p.hourlyPrice]));
    const pricedPairs = choices.pairs.filter((p) => priceMap.has(p.instructor.id));
    const pricedInstructorIds = new Set(pricedPairs.map((p) => p.instructor.id));
    const pricedCars = pricedPairs.map((p) => p.car).filter((car, index, arr) => arr.findIndex((x) => x.id === car.id) === index);
    return NextResponse.json({
      instructors: choices.instructors.filter((i) => pricedInstructorIds.has(i.id)).map((i) => ({ id: i.id, name: `${i.firstName} ${i.lastName}`, experience: i.experience, phone: i.phone, transmission: i.transmission, places: i.places, carId: i.carId })),
      cars: pricedCars.map((c) => ({ id: c.id, name: c.name, year: c.year, transmission: c.transmission })),
      pairs: pricedPairs.map((p) => ({ instructorId: p.instructor.id, carId: p.car.id })),
      prices: Object.fromEntries(prices.filter((p) => pricedInstructorIds.has(p.instructorId)).map((p) => [p.instructorId, p.hourlyPrice])),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Не удалось получить свободные варианты.' }, { status: 500 });
  }
}
