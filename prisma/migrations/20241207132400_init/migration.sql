-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER', 'SERVICE', 'ADMIN', 'USER', 'LEGACY_ADMIN', 'LEGACY_USER', 'GUEST');

-- CreateTable
CREATE TABLE "Users" (
    "id" VARCHAR(100) NOT NULL,
    "wardId" VARCHAR(100) NOT NULL,
    "username" VARCHAR(155) NOT NULL,
    "password" VARCHAR(155) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'GUEST',
    "display" VARCHAR(150),
    "pic" VARCHAR(255),
    "comment" VARCHAR(255),
    "createBy" VARCHAR(155),
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wards" (
    "id" VARCHAR(100) NOT NULL,
    "wardName" VARCHAR(250) NOT NULL,
    "wardSeq" SERIAL NOT NULL,
    "hosId" VARCHAR(100) NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospitals" (
    "id" VARCHAR(100) NOT NULL,
    "hosName" VARCHAR(155) NOT NULL,
    "hosSeq" SERIAL NOT NULL,
    "hosAddress" VARCHAR(155),
    "hosTel" VARCHAR(100),
    "userContact" VARCHAR(155),
    "userTel" VARCHAR(100),
    "hosLatitude" VARCHAR(155),
    "hosLongitude" VARCHAR(155),
    "hosPic" VARCHAR(255),
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Wards_wardSeq_key" ON "Wards"("wardSeq");

-- CreateIndex
CREATE UNIQUE INDEX "Hospitals_hosSeq_key" ON "Hospitals"("hosSeq");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Wards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wards" ADD CONSTRAINT "Wards_hosId_fkey" FOREIGN KEY ("hosId") REFERENCES "Hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
