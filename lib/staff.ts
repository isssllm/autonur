import 'server-only';
import { prisma } from '@/lib/prisma';
import { requireRole, scopedCityId } from '@/lib/auth';

export async function getStaffCity(searchCity?: string) {
  const user = await requireRole(['ADMIN', 'MANAGER']);
  const cityId = await scopedCityId(user, searchCity);
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) throw new Error('CITY_NOT_FOUND');
  return { user, city };
}
