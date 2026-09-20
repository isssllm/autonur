import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { syncCompletedBookings } from '@/lib/booking-status';

export async function POST(request: Request) {
  try {
    const user = await requireRole(['USER']);
    const { citySlug } = await request.json();
    const city = await prisma.city.findUnique({ where: { slug: String(citySlug || '') } });
    if (!city) return NextResponse.json({ error: 'Город не найден.' }, { status: 404 });
    await syncCompletedBookings(user.cityId || undefined);
    const today = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const todayStart = new Date(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`);
    const activeBooking = await prisma.booking.findFirst({ where: { userId: user.id, status: { in: ['NEW', 'CONFIRMED'] }, date: { gte: todayStart } } });
    if (activeBooking) return NextResponse.json({ error: 'Сначала обратитесь к менеджеру: у вас есть активная запись.' }, { status: 409 });
    await prisma.user.update({ where: { id: user.id }, data: { cityId: city.id } });
    return NextResponse.json({ ok: true, next: `/${city.slug}` });
  } catch (error) {
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Нужно войти в аккаунт.' : 'Не удалось изменить город.' }, { status });
  }
}
