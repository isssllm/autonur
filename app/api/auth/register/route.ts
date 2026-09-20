import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSession } from '@/lib/security';
import { isValidPassword, normalizePhone } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const phone = normalizePhone(String(body.phone || ''));
    const password = String(body.password || '');
    const confirmPassword = String(body.confirmPassword || '');
    if (!firstName || !lastName || !phone) return NextResponse.json({ error: 'Заполните имя, фамилию и корректный номер.' }, { status: 400 });
    if (!isValidPassword(password)) return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов.' }, { status: 400 });
    if (password !== confirmPassword) return NextResponse.json({ error: 'Пароли не совпадают.' }, { status: 400 });
    if (await prisma.user.findUnique({ where: { phone } })) return NextResponse.json({ error: 'Этот номер уже зарегистрирован.' }, { status: 409 });
    const user = await prisma.user.create({ data: { firstName, lastName, phone, passwordHash: hashPassword(password), role: 'USER' } });
    await setSession(user.id);
    return NextResponse.json({ ok: true, next: '/choose-city' });
  } catch {
    return NextResponse.json({ error: 'Не удалось создать аккаунт. Попробуйте ещё раз.' }, { status: 500 });
  }
}
