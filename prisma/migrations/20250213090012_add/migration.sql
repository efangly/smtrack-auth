-- CreateEnum
CREATE TYPE "HosType" AS ENUM ('HOSPITAL', 'LEGACY', 'CLINIC', 'PHARMACY', 'LAB', 'OTHER');

-- AlterTable
ALTER TABLE "Hospitals" ADD COLUMN     "hosType" "HosType" NOT NULL DEFAULT 'HOSPITAL';
