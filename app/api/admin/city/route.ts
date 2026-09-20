import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export async function GET(request: Request) {
  try {
    const user = await requireRole(['ADMIN', 'MANAGER']);
    let cityId = user.cityId;
    if (user.role === 'ADMIN') {
      const slug = new URL(request.url).searchParams.get('city') || '';
      cityId = (await prisma.city.findUnique({ where: { slug } }))?.id || null;
    }
    const city = cityId ? await prisma.city.findUnique({ where: { id: cityId } }) : null;
    return NextResponse.json({ city: city ? { id: city.id, slug: city.slug, name: city.name } : null });
  } catch { return NextResponse.json({ error: 'Нет доступа.' }, { status: 403 }); }
}
