import { redirect } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncCompletedBookings } from '@/lib/booking-status';
import InstructorBookings from '@/components/instructor-bookings';

export const dynamic = 'force-dynamic';

export default async function InstructorPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'INSTRUCTOR' || !user.instructor) {
    redirect('/login');
  }

  await syncCompletedBookings(user.cityId || undefined);

  const bookings = await prisma.booking.findMany({
    where: { instructorId: user.instructor.id },
    include: { user: true, car: true },
    orderBy: [{ date: 'desc' }, { startHour: 'desc' }],
  });

  return (
    <>
      <SiteHeader />
      <InstructorBookings
        instructor={`${user.firstName} ${user.lastName}`}
        initial={bookings.map((booking) => ({
          id: booking.id,
          date: booking.date.toISOString().slice(0, 10),
          startHour: booking.startHour,
          endHour: booking.endHour,
          name: `${booking.user.firstName} ${booking.user.lastName}`,
          phone: booking.user.phone,
          car: booking.car.name,
          transmission: booking.transmission,
          place: booking.place,
          status: booking.status,
        }))}
      />
    </>
  );
}
