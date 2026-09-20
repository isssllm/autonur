import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSession } from '@/lib/security';
import { normalizePhone } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const { phone, code, password, confirmPassword } = await request.json();

    if (String(password || '').length < 8) {
      return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Пароли не совпадают.' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(String(phone || ''));
    const user = normalizedPhone ? await prisma.user.findUnique({ where: { phone: normalizedPhone } }) : null;
    const tokenHash = createHash('sha256').update(String(code || '')).digest('hex');
    const token = user ? await prisma.recoveryToken.findFirst({
      where: { userId: user.id, tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    }) : null;

    if (!user || !token) {
      return NextResponse.json({ error: 'Код недействителен или устарел.' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(String(password)) } }),
      prisma.recoveryToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    ]);

    await setSession(user.id);
    const city = user.cityId ? await prisma.city.findUnique({ where: { id: user.cityId } }) : null;
    return NextResponse.json({ ok: true, next: city?.slug ? `/${city.slug}` : '/choose-city' });
  } catch {
    return NextResponse.json({ error: 'Не удалось восстановить доступ.' }, { status: 500 });
  }
}
