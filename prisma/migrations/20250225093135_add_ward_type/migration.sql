-- CreateEnum
CREATE TYPE "WardType" AS ENUM ('NEW', 'LEGACY');

-- AlterTable
ALTER TABLE "Wards" ADD COLUMN     "type" "WardType" DEFAULT 'NEW';
