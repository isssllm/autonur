import 'server-only';
import { prisma } from './prisma';
import { getSessionPayload } from './security';

export async function getCurrentUser() {
  const session = await getSessionPayload();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { city: true, manager: true, instructor: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(roles: Array<'USER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR'>) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}

export async function scopedCityId(user: Awaited<ReturnType<typeof requireUser>>, requested?: string) {
  if (user.role === 'ADMIN') {
    if (!requested) throw new Error('CITY_REQUIRED');
    const city = await prisma.city.findUnique({ where: { slug: requested } });
    if (!city) throw new Error('CITY_NOT_FOUND');
    return city.id;
  }
  if (!user.cityId) throw new Error('CITY_REQUIRED');
  return user.cityId;
}
