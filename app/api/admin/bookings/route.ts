import { NextResponse } from 'next/server';
import { BookingStatus, LessonPlace, Transmission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStaffCity } from '@/lib/staff';
import { dateOnly } from '@/lib/validation';

function dto(b: any) {
  return { id: b.id, name: `${b.user.firstName} ${b.user.lastName}`, phone: b.user.phone, date: b.date.toISOString().slice(0, 10), startHour: b.startHour, endHour: b.endHour, duration: b.endHour - b.startHour, instructor: `${b.instructor.firstName} ${b.instructor.lastName}`, instructorId: b.instructorId, car: b.car.name, carId: b.carId, transmission: b.transmission, place: b.place, hourlyPrice: b.hourlyPrice, totalPrice: b.totalPrice, status: b.status };
}

export async function GET(request: Request) {
  try {
    const citySlug = new URL(request.url).searchParams.get('city') || undefined;
    const { city } = await getStaffCity(citySlug);
    const bookings = await prisma.booking.findMany({ where: { cityId: city.id }, include: { user: true, instructor: true, car: true }, orderBy: [{ date: 'desc' }, { startHour: 'desc' }] });
    return NextResponse.json({ bookings: bookings.map(dto) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.message === 'FORBIDDEN' ? 'Нет доступа.' : 'Не удалось загрузить записи.' }, { status: 403 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { city } = await getStaffCity(String(body.city || ''));
    const booking = await prisma.booking.findUnique({ where: { id: String(body.bookingId || '') } });
    if (!booking || booking.cityId !== city.id) return NextResponse.json({ error: 'Запись не найдена.' }, { status: 404 });
    const nextStatus = body.status ? body.status as BookingStatus : booking.status;
    if (!Object.values(BookingStatus).includes(nextStatus)) return NextResponse.json({ error: 'Недопустимый статус.' }, { status: 400 });
    const hasScheduleChange = ['date', 'startHour', 'endHour', 'instructorId', 'carId', 'transmission', 'place'].some((key) => body[key] !== undefined);
    if (nextStatus === BookingStatus.CANCELLED && !hasScheduleChange) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: nextStatus } });
      return NextResponse.json({ ok: true });
    }

    const date = body.date ? dateOnly(String(body.date)) : booking.date;
    const startHour = body.startHour === undefined ? booking.startHour : Number(body.startHour);
    const endHour = body.endHour === undefined ? booking.endHour : Number(body.endHour);
    const instructorId = body.instructorId === undefined ? booking.instructorId : String(body.instructorId);
    const carId = body.carId === undefined ? booking.carId : String(body.carId);
    const transmission = body.transmission === undefined ? booking.transmission : body.transmission as Transmission;
    const place = body.place === undefined ? booking.place : body.place as LessonPlace;
    if (!date || !Number.isInteger(startHour) || !Number.isInteger(endHour) || startHour < 0 || endHour > 24 || endHour <= startHour || !Object.values(Transmission).includes(transmission) || !Object.values(LessonPlace).includes(place)) return NextResponse.json({ error: 'Некорректное расписание.' }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const instructor = await tx.instructor.findFirst({ where: { id: instructorId, cityId: city.id, transmission: { has: transmission }, places: { has: place } } });
      const car = await tx.car.findFirst({ where: { id: carId, cityId: city.id, transmission } });
      if (!instructor || !car || instructor.carId !== car.id) throw new Error('INCOMPATIBLE');
      await tx.scheduleSlot.updateMany({ where: { bookingId: booking.id }, data: { isFree: true, bookingId: null } });
      const slots = await tx.scheduleSlot.findMany({ where: { cityId: city.id, instructorId, carId, date, transmission, place, hour: { gte: startHour, lt: endHour }, isFree: true }, orderBy: { hour: 'asc' } });
      if (slots.length !== endHour - startHour) throw new Error('BUSY');
      const conflict = await tx.booking.findFirst({ where: { id: { not: booking.id }, OR: [{ instructorId }, { carId }], date, status: { not: BookingStatus.CANCELLED }, startHour: { lt: endHour }, endHour: { gt: startHour } } });
      if (conflict) throw new Error('BUSY');
      const totalPrice = booking.hourlyPrice * (endHour - startHour);
      const updated = await tx.booking.update({ where: { id: booking.id }, data: { date, startHour, endHour, instructorId, carId, transmission, place, hourlyPrice: booking.hourlyPrice, totalPrice, status: nextStatus } });
      await tx.scheduleSlot.updateMany({ where: { id: { in: slots.map((s) => s.id) } }, data: { isFree: false, bookingId: updated.id } });
      return updated;
    }, { isolationLevel: 'Serializable' });
    return NextResponse.json({ ok: true, booking: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'INCOMPATIBLE') return NextResponse.json({ error: 'Инструктор, автомобиль, коробка и место занятия несовместимы.' }, { status: 409 });
    if (message === 'BUSY') return NextResponse.json({ error: 'Выбранный период занят. Проверьте расписание.' }, { status: 409 });
    return NextResponse.json({ error: 'Не удалось изменить запись.' }, { status: 500 });
  }
}
