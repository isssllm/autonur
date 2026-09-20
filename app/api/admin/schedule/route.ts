import { NextResponse } from 'next/server';
import { BookingStatus, LessonPlace, Transmission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStaffCity } from '@/lib/staff';
import { dateOnly, almatyTodayKey } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    const { city } = await getStaffCity(p.get('city') || undefined);
    const from = dateOnly(p.get('from') || almatyTodayKey())!;
    const to = dateOnly(p.get('to') || p.get('from') || almatyTodayKey())!;
    const slots = await prisma.scheduleSlot.findMany({ where: { cityId: city.id, date: { gte: from, lte: to } }, include: { instructor: true, car: true, booking: { include: { user: true } } }, orderBy: [{ date: 'asc' }, { hour: 'asc' }] });
    return NextResponse.json({ slots: slots.map((s) => ({ id: s.id, date: s.date.toISOString().slice(0, 10), hour: s.hour, isFree: s.isFree, instructorId: s.instructorId, instructor: `${s.instructor.firstName} ${s.instructor.lastName}`, carId: s.carId, car: s.car.name, transmission: s.transmission, place: s.place, booking: s.booking ? { id: s.booking.id, name: `${s.booking.user.firstName} ${s.booking.user.lastName}`, phone: s.booking.user.phone, status: s.booking.status } : null })) });
  } catch { return NextResponse.json({ error: 'Не удалось загрузить расписание.' }, { status: 403 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { city } = await getStaffCity(String(body.city || ''));
    const instructorId = String(body.instructorId || '');
    const carId = String(body.carId || '');
    const place = body.place as LessonPlace;
    const transmission = body.transmission as Transmission;
    const hourFrom = Number(body.hourFrom); const hourTo = Number(body.hourTo);
    const from = dateOnly(String(body.from || '')); const to = dateOnly(String(body.to || body.from || ''));
    const weekdays: number[] = Array.isArray(body.weekdays) ? body.weekdays.map(Number) : [0,1,2,3,4,5,6];
    if (!from || !to || to < from || hourTo < hourFrom || hourFrom < 0 || hourTo > 23 || !Object.values(LessonPlace).includes(place) || !Object.values(Transmission).includes(transmission)) return NextResponse.json({ error: 'Проверьте параметры слотов.' }, { status: 400 });
    const instructor = await prisma.instructor.findFirst({ where: { id: instructorId, cityId: city.id, transmission: { has: transmission }, places: { has: place } } });
    const car = await prisma.car.findFirst({ where: { id: carId, cityId: city.id, transmission } });
    if (!instructor || !car || instructor.carId !== car.id) return NextResponse.json({ error: 'Инструктор и автомобиль несовместимы.' }, { status: 409 });
    let created = 0;
    for (let cursor = new Date(from); cursor <= to; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const weekday = cursor.getUTCDay();
      if (!weekdays.includes(weekday)) continue;
      for (let hour = hourFrom; hour <= hourTo; hour += 1) {
        try {
          await prisma.scheduleSlot.create({ data: { cityId: city.id, instructorId, carId, date: new Date(cursor), hour, transmission: car.transmission, place } });
          created += 1;
        } catch { /* duplicate slot: explicitly skipped */ }
      }
    }
    return NextResponse.json({ ok: true, created });
  } catch { return NextResponse.json({ error: 'Не удалось создать слоты.' }, { status: 500 }); }
}


export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { city } = await getStaffCity(String(body.city || ''));
    const slotId = String(body.slotId || '');
    const date = dateOnly(String(body.date || ''));
    const hour = Number(body.hour);
    const instructorId = String(body.instructorId || '');
    const carId = String(body.carId || '');
    const place = body.place as LessonPlace;
    const transmission = body.transmission as Transmission;
    if (!date || !Number.isInteger(hour) || hour < 0 || hour > 23 || !Object.values(LessonPlace).includes(place) || !Object.values(Transmission).includes(transmission)) return NextResponse.json({ error: 'Проверьте параметры слота.' }, { status: 400 });
    const slot = await prisma.scheduleSlot.findUnique({ where: { id: slotId } });
    if (!slot || slot.cityId !== city.id) return NextResponse.json({ error: 'Слот не найден.' }, { status: 404 });
    if (!slot.isFree || slot.bookingId) return NextResponse.json({ error: 'Занятый слот изменяется через раздел «Записи».' }, { status: 409 });
    const instructor = await prisma.instructor.findFirst({ where: { id: instructorId, cityId: city.id, transmission: { has: transmission }, places: { has: place } } });
    const car = await prisma.car.findFirst({ where: { id: carId, cityId: city.id, transmission } });
    if (!instructor || !car || instructor.carId !== car.id) return NextResponse.json({ error: 'Инструктор и автомобиль несовместимы.' }, { status: 409 });
    const existing = await prisma.scheduleSlot.findFirst({ where: { id: { not: slot.id }, OR: [{ instructorId, date, hour }, { carId, date, hour }] } });
    if (existing) return NextResponse.json({ error: 'На это время у инструктора или автомобиля уже есть слот.' }, { status: 409 });
    const updated = await prisma.scheduleSlot.update({ where: { id: slot.id }, data: { date, hour, instructorId, carId, transmission, place } });
    return NextResponse.json({ ok: true, slot: updated });
  } catch { return NextResponse.json({ error: 'Не удалось изменить слот.' }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { city } = await getStaffCity(String(body.city || ''));
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) return NextResponse.json({ error: 'Не выбраны слоты.' }, { status: 400 });
    const slots = await prisma.scheduleSlot.findMany({ where: { id: { in: ids }, cityId: city.id }, select: { id: true, bookingId: true } });
    const bookingIds = [...new Set(slots.map((s) => s.bookingId).filter(Boolean) as string[])];
    await prisma.$transaction(async (tx) => {
      if (bookingIds.length) {
        await tx.booking.updateMany({ where: { id: { in: bookingIds }, cityId: city.id }, data: { status: BookingStatus.CANCELLED } });
        await tx.scheduleSlot.updateMany({ where: { bookingId: { in: bookingIds }, cityId: city.id }, data: { isFree: true, bookingId: null } });
      }
      const freeIds = slots.filter((s) => !s.bookingId).map((s) => s.id);
      if (freeIds.length) await tx.scheduleSlot.deleteMany({ where: { id: { in: freeIds }, cityId: city.id } });
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Не удалось удалить/освободить слоты.' }, { status: 500 }); }
}
