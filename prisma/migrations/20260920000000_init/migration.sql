CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MANAGER', 'INSTRUCTOR');
CREATE TYPE "Transmission" AS ENUM ('AUTOMATIC', 'MANUAL');
CREATE TYPE "LessonPlace" AS ENUM ('CITY', 'AUTODROME');
CREATE TYPE "BookingStatus" AS ENUM ('NEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "City" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "autodrome" TEXT NOT NULL,
  "gisUrl" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "cityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

CREATE TABLE "Manager" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Manager_userId_key" ON "Manager"("userId");

CREATE TABLE "Instructor" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "photo" TEXT NOT NULL,
  "experience" INTEGER NOT NULL,
  "transmission" "Transmission"[] NOT NULL,
  "places" "LessonPlace"[] NOT NULL,
  "cityId" TEXT NOT NULL,
  "carId" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

CREATE TABLE "Car" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "photo" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "transmission" "Transmission" NOT NULL,
  "cityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Price" (
  "id" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "place" "LessonPlace" NOT NULL,
  "hourlyPrice" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Price_cityId_instructorId_place_key" ON "Price"("cityId", "instructorId", "place");
CREATE INDEX "Price_cityId_instructorId_place_active_idx" ON "Price"("cityId", "instructorId", "place", "active");

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "startHour" INTEGER NOT NULL,
  "endHour" INTEGER NOT NULL,
  "transmission" "Transmission" NOT NULL,
  "place" "LessonPlace" NOT NULL,
  "hourlyPrice" INTEGER NOT NULL,
  "totalPrice" INTEGER NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Booking_cityId_date_idx" ON "Booking"("cityId", "date");
CREATE INDEX "Booking_instructorId_date_idx" ON "Booking"("instructorId", "date");
CREATE INDEX "Booking_carId_date_idx" ON "Booking"("carId", "date");
CREATE INDEX "Booking_userId_date_idx" ON "Booking"("userId", "date");

CREATE TABLE "ScheduleSlot" (
  "id" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "instructorId" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "hour" INTEGER NOT NULL,
  "transmission" "Transmission" NOT NULL,
  "place" "LessonPlace" NOT NULL,
  "bookingId" TEXT,
  "isFree" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleSlot_instructorId_date_hour_key" ON "ScheduleSlot"("instructorId", "date", "hour");
CREATE UNIQUE INDEX "ScheduleSlot_carId_date_hour_key" ON "ScheduleSlot"("carId", "date", "hour");
CREATE INDEX "ScheduleSlot_cityId_date_isFree_idx" ON "ScheduleSlot"("cityId", "date", "isFree");

CREATE TABLE "RecoveryToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecoveryToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RecoveryToken_tokenHash_key" ON "RecoveryToken"("tokenHash");

ALTER TABLE "User" ADD CONSTRAINT "User_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Car" ADD CONSTRAINT "Car_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Price" ADD CONSTRAINT "Price_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Price" ADD CONSTRAINT "Price_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecoveryToken" ADD CONSTRAINT "RecoveryToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
