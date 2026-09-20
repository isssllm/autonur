import 'server-only';
import { BookingStatus } from '@prisma/client';
import { prisma } from './prisma';

export async function syncCompletedBookings(cityId?: string) {
  const now = new Date();
  const local = new Date(now.getTime() + 5 * 60 * 60 * 1000); // Asia/Almaty is UTC+5.
  const todayKey = local.toISOString().slice(0, 10);
  const todayStart = new Date(`${todayKey}T00:00:00.000Z`);
  const localHour = local.getUTCHours();
  await prisma.booking.updateMany({
    where: {
      ...(cityId ? { cityId } : {}),
      status: BookingStatus.CONFIRMED,
      OR: [
        { date: { lt: todayStart } },
        { date: todayStart, endHour: { lte: localHour } },
      ],
    },
    data: { status: BookingStatus.COMPLETED },
  });
}
