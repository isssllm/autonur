import { NextResponse } from 'next/server';
import { LessonPlace } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStaffCity } from '@/lib/staff';
export async function GET(request: Request) {
  try { const { city } = await getStaffCity(new URL(request.url).searchParams.get('city') || undefined); const prices = await prisma.price.findMany({ where: { cityId: city.id }, include: { instructor: true }, orderBy: [{ instructor: { firstName: 'asc' } }, { place: 'asc' }] }); return NextResponse.json({ prices: prices.map((p) => ({ id: p.id, instructorId: p.instructorId, instructor: `${p.instructor.firstName} ${p.instructor.lastName}`, place: p.place, hourlyPrice: p.hourlyPrice, active: p.active })) }); } catch { return NextResponse.json({ error: 'Не удалось загрузить цены.' }, { status: 403 }); }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { user, city } = await getStaffCity(String(body.city || ''));
    if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Только администратор может менять цены.' }, { status: 403 });
    const instructorId = String(body.instructorId || ''); const place = body.place as LessonPlace; const hourlyPrice = Number(body.hourlyPrice);
    if (!Number.isInteger(hourlyPrice) || hourlyPrice <= 0 || !Object.values(LessonPlace).includes(place)) return NextResponse.json({ error: 'Некорректная цена.' }, { status: 400 });
    const instructor = await prisma.instructor.findFirst({ where: { id: instructorId, cityId: city.id, places: { has: place } } });
    if (!instructor) return NextResponse.json({ error: 'Инструктор не найден.' }, { status: 404 });
    const price = await prisma.price.upsert({ where: { cityId_instructorId_place: { cityId: city.id, instructorId, place } }, update: { hourlyPrice, active: true }, create: { cityId: city.id, instructorId, place, hourlyPrice } });
    return NextResponse.json({ ok: true, price });
  } catch { return NextResponse.json({ error: 'Не удалось сохранить цену.' }, { status: 500 }); }
}
