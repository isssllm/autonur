import { NextResponse } from 'next/server';
import { BookingStatus, LessonPlace, Transmission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { dateOnly, isHourInFutureForAlmaty } from '@/lib/validation';
import { syncCompletedBookings } from '@/lib/booking-status';

export async function POST(request: Request) {
  try {
    const user = await requireRole(['USER']);
    const body = await request.json();
    const citySlug = String(body.citySlug || '');
    const dateValue = String(body.date || '');
    const startHour = Number(body.startHour);
    const endHour = Number(body.endHour);
    const instructorId = String(body.instructorId || '');
    const carId = String(body.carId || '');
    const transmission = body.transmission as Transmission;
    const place = body.place as LessonPlace;
    if (!citySlug || !dateOnly(dateValue) || !Number.isInteger(startHour) || !Number.isInteger(endHour) || endHour <= startHour || !Object.values(Transmission).includes(transmission) || !Object.values(LessonPlace).includes(place)) return NextResponse.json({ error: 'Проверьте данные записи.' }, { status: 400 });
    const city = await prisma.city.findUnique({ where: { slug: citySlug } });
    if (!city) return NextResponse.json({ error: 'Город не найден.' }, { status: 404 });
    const date = dateOnly(dateValue)!;
    const [instructor, car, price] = await Promise.all([
      prisma.instructor.findFirst({ where: { id: instructorId, cityId: city.id, transmission: { has: transmission }, places: { has: place } } }),
      prisma.car.findFirst({ where: { id: carId, cityId: city.id, transmission } }),
      prisma.price.findUnique({ where: { cityId_instructorId_place: { cityId: city.id, instructorId, place } } }),
    ]);
    if (!instructor || !car || !price || !price.active || instructor.carId !== car.id) return NextResponse.json({ error: 'Выбранные инструктор и автомобиль больше недоступны.' }, { status: 409 });
    if (startHour < 0 || endHour > 24 || !isHourInFutureForAlmaty(date, startHour)) return NextResponse.json({ error: 'Нельзя выбрать прошедшее время.' }, { status: 400 });

    try {
      const booking = await prisma.$transaction(async (tx) => {
        const slots = await tx.scheduleSlot.findMany({ where: { cityId: city.id, instructorId, carId, date, transmission, place, hour: { gte: startHour, lt: endHour }, isFree: true }, orderBy: { hour: 'asc' } });
        if (slots.length !== endHour - startHour) throw new Error('SLOTS_BUSY');
        for (let hour = startHour; hour < endHour; hour += 1) if (!slots.find((slot) => slot.hour === hour)) throw new Error('SLOTS_BUSY');
        const clash = await tx.booking.findFirst({ where: { OR: [{ instructorId }, { carId }], date, status: { not: BookingStatus.CANCELLED }, startHour: { lt: endHour }, endHour: { gt: startHour } } });
        if (clash) throw new Error('SLOTS_BUSY');
        const created = await tx.booking.create({ data: { userId: user.id, cityId: city.id, instructorId, carId, date, startHour, endHour, transmission, place, hourlyPrice: price.hourlyPrice, totalPrice: price.hourlyPrice * (endHour - startHour), status: BookingStatus.NEW } });
        await tx.scheduleSlot.updateMany({ where: { id: { in: slots.map((slot) => slot.id) }, isFree: true }, data: { isFree: false, bookingId: created.id } });
        return created;
      }, { isolationLevel: 'Serializable' });
      return NextResponse.json({ ok: true, bookingId: booking.id });
    } catch (error) {
      if (error instanceof Error && error.message === 'SLOTS_BUSY') return NextResponse.json({ error: 'Эти часы уже заняли. Вернитесь назад и выберите другое время.' }, { status: 409 });
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 401 ? 'Войдите в аккаунт, чтобы записаться.' : status === 403 ? 'У вас нет доступа к созданию записи.' : 'Не удалось создать запись.' }, { status });
  }
}

export async function GET() {
  try {
    const user = await requireRole(['USER']);
    await syncCompletedBookings(user.cityId || undefined);
    const bookings = await prisma.booking.findMany({ where: { userId: user.id }, include: { city: true, instructor: true, car: true }, orderBy: [{ date: 'desc' }, { startHour: 'desc' }] });
    return NextResponse.json({ bookings: bookings.map(bookingDto) });
  } catch { return NextResponse.json({ error: 'Нужно войти в аккаунт.' }, { status: 401 }); }
}

function bookingDto(b: any) {
  return { id: b.id, city: b.city.name, citySlug: b.city.slug, date: b.date.toISOString().slice(0, 10), startHour: b.startHour, endHour: b.endHour, duration: b.endHour - b.startHour, instructor: `${b.instructor.firstName} ${b.instructor.lastName}`, car: b.car.name, transmission: b.transmission, place: b.place, hourlyPrice: b.hourlyPrice, totalPrice: b.totalPrice, status: b.status };
}
