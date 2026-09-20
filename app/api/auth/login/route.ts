import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSession, verifyPassword } from '@/lib/security';
import { normalizePhone } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(String(body.phone || ''));
    const password = String(body.password || '');
    const user = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
    if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: 'Неверный номер телефона или пароль.' }, { status: 401 });
    await setSession(user.id);
    const city = user.cityId ? await prisma.city.findUnique({ where: { id: user.cityId }, select: { slug: true } }) : null;
    const next = user.role === 'ADMIN'
      ? '/admin/select-city'
      : user.role === 'MANAGER'
        ? (city ? `/admin?city=${city.slug}` : '/login')
        : user.role === 'INSTRUCTOR'
          ? '/instructor'
          : (city ? `/${city.slug}` : '/');
    return NextResponse.json({ ok: true, next });
  } catch {
    return NextResponse.json({ error: 'Не удалось выполнить вход.' }, { status: 500 });
  }
}
