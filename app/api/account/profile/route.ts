import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try { const user = await requireRole(['USER']); return NextResponse.json({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, city: user.city ? { slug: user.city.slug, name: user.city.name } : null }); }
  catch { return NextResponse.json({ error: 'Нужно войти в аккаунт.' }, { status: 401 }); }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(['USER']);
    const body = await request.json();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    if (!firstName || !lastName) return NextResponse.json({ error: 'Имя и фамилия обязательны.' }, { status: 400 });
    const updated = await prisma.user.update({ where: { id: user.id }, data: { firstName, lastName } });
    return NextResponse.json({ ok: true, user: { firstName: updated.firstName, lastName: updated.lastName } });
  } catch { return NextResponse.json({ error: 'Не удалось сохранить профиль.' }, { status: 500 }); }
}
