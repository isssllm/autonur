import { PrismaClient, Role, Transmission, LessonPlace } from '@prisma/client';
import { hashPassword } from '../lib/password';
import { normalizePhone } from '../lib/validation';

const prisma = new PrismaClient();

const citySeed = [
  { slug: 'astana', name: 'Астана', autodrome: 'г. Астана, ул. Жансугурова, 22', gisUrl: 'https://2gis.kz/astana', phone: '+7 777 100 10 10' },
  { slug: 'kokshetau', name: 'Кокшетау', autodrome: 'г. Кокшетау, ул. Абая, 114', gisUrl: 'https://2gis.kz/kokshetau', phone: '+7 777 200 20 20' },
  { slug: 'karaganda', name: 'Караганда', autodrome: 'г. Караганда, ул. Гоголя, 89', gisUrl: 'https://2gis.kz/karaganda', phone: '+7 777 300 30 30' },
] as const;

const carsSeed = [
  { city: 'astana', name: 'Toyota Corolla', transmission: Transmission.AUTOMATIC, year: 2023, photo: 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=900&q=80' },
  { city: 'astana', name: 'Hyundai Elantra', transmission: Transmission.AUTOMATIC, year: 2024, photo: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=80' },
  { city: 'astana', name: 'Lada Vesta', transmission: Transmission.MANUAL, year: 2022, photo: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80' },
  { city: 'kokshetau', name: 'Kia Rio', transmission: Transmission.AUTOMATIC, year: 2023, photo: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=900&q=80' },
  { city: 'kokshetau', name: 'Hyundai Accent', transmission: Transmission.MANUAL, year: 2023, photo: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=80' },
  { city: 'kokshetau', name: 'Toyota Camry', transmission: Transmission.AUTOMATIC, year: 2023, photo: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80' },
  { city: 'karaganda', name: 'Chevrolet Cobalt', transmission: Transmission.MANUAL, year: 2022, photo: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=900&q=80' },
  { city: 'karaganda', name: 'Hyundai Solaris', transmission: Transmission.AUTOMATIC, year: 2024, photo: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=900&q=80' },
] as const;

const instructorsSeed = [
  { city: 'astana', firstName: 'Ерлан', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=700&q=80', lastName: 'Ахметов', experience: 7, phone: '+7 701 111 11 11', transmission: [Transmission.AUTOMATIC], places: [LessonPlace.CITY, LessonPlace.AUTODROME], car: 'Toyota Corolla', userPhone: '+77011111111' },
  { city: 'astana', firstName: 'Марат', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80', lastName: 'Сейтов', experience: 10, phone: '+7 702 222 22 22', transmission: [Transmission.MANUAL], places: [LessonPlace.CITY], car: 'Lada Vesta', userPhone: '+77022222222' },
  { city: 'kokshetau', firstName: 'Данияр', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80', lastName: 'Омаров', experience: 6, phone: '+7 703 333 33 33', transmission: [Transmission.MANUAL], places: [LessonPlace.CITY, LessonPlace.AUTODROME], car: 'Hyundai Accent', userPhone: '+77033333333' },
  { city: 'kokshetau', firstName: 'Айдос', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80', lastName: 'Нурлан', experience: 8, phone: '+7 704 444 44 44', transmission: [Transmission.AUTOMATIC], places: [LessonPlace.CITY, LessonPlace.AUTODROME], car: 'Toyota Camry', userPhone: '+77044444444' },
  { city: 'karaganda', firstName: 'Руслан', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=700&q=80', lastName: 'Бек', experience: 9, phone: '+7 705 555 55 55', transmission: [Transmission.MANUAL], places: [LessonPlace.CITY], car: 'Chevrolet Cobalt', userPhone: '+77055555555' },
  { city: 'karaganda', firstName: 'Тимур', photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=700&q=80', lastName: 'Алиев', experience: 5, phone: '+7 706 666 66 66', transmission: [Transmission.AUTOMATIC], places: [LessonPlace.CITY, LessonPlace.AUTODROME], car: 'Hyundai Solaris', userPhone: '+77066666666' },
] as const;

const priceMap: Record<string, Record<'CITY' | 'AUTODROME', number>> = {
  '+77011111111': { CITY: 6000, AUTODROME: 5000 },
  '+77022222222': { CITY: 5500, AUTODROME: 5000 },
  '+77033333333': { CITY: 5000, AUTODROME: 4500 },
  '+77044444444': { CITY: 6000, AUTODROME: 5000 },
  '+77055555555': { CITY: 5500, AUTODROME: 4500 },
  '+77066666666': { CITY: 6000, AUTODROME: 5000 },
};

async function ensureDeveloperAdmin() {
  const phone = normalizePhone(process.env.DEVELOPER_PHONE || '');
  if (!phone) return;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: Role.ADMIN } });
    console.log(`Developer admin is ADMIN: ${phone}`);
    return;
  }

  const password = process.env.DEVELOPER_PASSWORD || '';
  if (password.length < 8) {
    throw new Error('DEVELOPER_PASSWORD must contain at least 8 characters when creating the developer admin.');
  }

  await prisma.user.create({
    data: {
      firstName: String(process.env.DEVELOPER_FIRST_NAME || 'Ислам').trim() || 'Ислам',
      lastName: String(process.env.DEVELOPER_LAST_NAME || 'Developer').trim() || 'Developer',
      phone,
      passwordHash: hashPassword(password),
      role: Role.ADMIN,
    },
  });
  console.log(`Developer admin created: ${phone}`);
}

async function upsertBaseData() {
  const cities = new Map<string, { id: string }>();
  for (const city of citySeed) {
    const row = await prisma.city.upsert({
      where: { slug: city.slug },
      update: { name: city.name, autodrome: city.autodrome, gisUrl: city.gisUrl, phone: city.phone },
      create: city,
    });
    cities.set(city.slug, row);
  }

  const admin = await prisma.user.upsert({
    where: { phone: '+77000000000' },
    update: { firstName: 'Главный', lastName: 'Администратор', role: Role.ADMIN },
    create: { firstName: 'Главный', lastName: 'Администратор', phone: '+77000000000', passwordHash: hashPassword('Admin12345!'), role: Role.ADMIN },
  });
  void admin;

  for (const city of citySeed) {
    const c = cities.get(city.slug)!;
    const managerPhone = city.slug === 'astana' ? '+77000000001' : city.slug === 'kokshetau' ? '+77000000002' : '+77000000003';
    const manager = await prisma.user.upsert({
      where: { phone: managerPhone },
      update: { firstName: 'Менеджер', lastName: city.name, role: Role.MANAGER, cityId: c.id },
      create: { firstName: 'Менеджер', lastName: city.name, phone: managerPhone, passwordHash: hashPassword('Manager123!'), role: Role.MANAGER, cityId: c.id },
    });
    await prisma.manager.upsert({
      where: { userId: manager.id },
      update: { firstName: manager.firstName, lastName: manager.lastName, phone: manager.phone, cityId: c.id },
      create: { firstName: manager.firstName, lastName: manager.lastName, phone: manager.phone, cityId: c.id, userId: manager.id },
    });
  }

  const carByName = new Map<string, { id: string; cityId: string; transmission: Transmission }>();
  for (const car of carsSeed) {
    const c = cities.get(car.city)!;
    const existing = await prisma.car.findFirst({ where: { cityId: c.id, name: car.name } });
    const row = existing
      ? await prisma.car.update({ where: { id: existing.id }, data: { photo: car.photo, year: car.year, transmission: car.transmission } })
      : await prisma.car.create({ data: { name: car.name, photo: car.photo, year: car.year, transmission: car.transmission, cityId: c.id } });
    carByName.set(`${car.city}:${car.name}`, { id: row.id, cityId: c.id, transmission: row.transmission });
  }

  for (const ins of instructorsSeed) {
    const c = cities.get(ins.city)!;
    const car = carByName.get(`${ins.city}:${ins.car}`)!;
    const instructorUser = await prisma.user.upsert({
      where: { phone: ins.userPhone },
      update: { firstName: ins.firstName, lastName: ins.lastName, role: Role.INSTRUCTOR, cityId: c.id },
      create: { firstName: ins.firstName, lastName: ins.lastName, phone: ins.userPhone, passwordHash: hashPassword('Instructor123!'), role: Role.INSTRUCTOR, cityId: c.id },
    });

    const instructorExisting = await prisma.instructor.findFirst({ where: { userId: instructorUser.id } });
    const instructor = instructorExisting
      ? await prisma.instructor.update({
          where: { id: instructorExisting.id },
          data: { firstName: ins.firstName, lastName: ins.lastName, phone: ins.phone, photo: ins.photo, experience: ins.experience, transmission: ins.transmission, places: ins.places, cityId: c.id, carId: car.id },
        })
      : await prisma.instructor.create({
          data: { firstName: ins.firstName, lastName: ins.lastName, phone: ins.phone, photo: ins.photo, experience: ins.experience, transmission: ins.transmission, places: ins.places, cityId: c.id, carId: car.id, userId: instructorUser.id },
        });

    for (const place of ins.places) {
      await prisma.price.upsert({
        where: { cityId_instructorId_place: { cityId: c.id, instructorId: instructor.id, place } },
        update: { hourlyPrice: priceMap[ins.userPhone][place === LessonPlace.CITY ? 'CITY' : 'AUTODROME'], active: true },
        create: { cityId: c.id, instructorId: instructor.id, place, hourlyPrice: priceMap[ins.userPhone][place === LessonPlace.CITY ? 'CITY' : 'AUTODROME'] },
      });
    }

    const scheduleCount = await prisma.scheduleSlot.count({ where: { instructorId: instructor.id } });
    if (scheduleCount === 0) {
      const slots = [];
      for (let day = 0; day < 60; day += 1) {
        const base = new Date();
        base.setUTCHours(0, 0, 0, 0);
        base.setUTCDate(base.getUTCDate() + day + 1);
        const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
        for (let hour = 9; hour <= 18; hour += 1) {
          const place = ins.places.length === 1 ? ins.places[0] : hour <= 13 ? LessonPlace.CITY : LessonPlace.AUTODROME;
          slots.push({ cityId: c.id, instructorId: instructor.id, carId: car.id, date, hour, transmission: car.transmission, place });
        }
      }
      for (let i = 0; i < slots.length; i += 500) {
        await prisma.scheduleSlot.createMany({ data: slots.slice(i, i + 500), skipDuplicates: true });
      }
    }
  }

  await prisma.user.upsert({
    where: { phone: '+77001234567' },
    update: { firstName: 'Ислам', lastName: 'Демо', role: Role.USER, cityId: cities.get('astana')!.id },
    create: { firstName: 'Ислам', lastName: 'Демо', phone: '+77001234567', passwordHash: hashPassword('User12345!'), role: Role.USER, cityId: cities.get('astana')!.id },
  });

  console.log('Autonur base seed completed/preserved.');
}

async function main() {
  await upsertBaseData();
  await ensureDeveloperAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
