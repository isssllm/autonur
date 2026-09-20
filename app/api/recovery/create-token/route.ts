import { createHash, randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const manager = await requireRole(['MANAGER']);
    const { userId } = await request.json();
    const user = await prisma.user.findUnique({ where: { id: String(userId || '') } });
    if (!user || user.role !== 'USER') return NextResponse.json({ error: 'Пользователь не найден.' }, { status: 404 });
    if (manager.role === 'MANAGER' && user.cityId !== manager.cityId) return NextResponse.json({ error: 'Пользователь не относится к вашему городу.' }, { status: 403 });
    const raw = String(randomInt(100000, 999999));
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    await prisma.recoveryToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await prisma.recoveryToken.create({ data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 15 * 60 * 1000) } });
    return NextResponse.json({ ok: true, code: raw, expiresInMinutes: 15 });
  } catch { return NextResponse.json({ error: 'Недостаточно прав.' }, { status: 403 }); }
}
