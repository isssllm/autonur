import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/validation';
export async function POST(request: Request) {
  const { phone } = await request.json();
  const normalized = normalizePhone(String(phone || ''));
  if (!normalized) return NextResponse.json({ error: 'Введите корректный номер телефона.' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { phone: normalized } });
  void user;
  return NextResponse.json({ ok: true, message: 'Обратитесь к менеджеру вашего города. После создания кода менеджер передаст его вам.' });
}
