/*
  Warnings:

  - You are about to drop the column `familyId` on the `meal_signups` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `families` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,organizationId,date]` on the table `meal_signups` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `meal_signups` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OrganizationType" AS ENUM ('FAMILY', 'STORE');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- DropForeignKey
ALTER TABLE "public"."meal_signups" DROP CONSTRAINT "meal_signups_familyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_familyId_fkey";

-- DropIndex
DROP INDEX "public"."meal_signups_userId_familyId_date_key";

-- AlterTable
ALTER TABLE "public"."meal_signups" DROP COLUMN "familyId",
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "familyId",
ADD COLUMN     "lastSelectedOrganizationId" TEXT;

-- DropTable
DROP TABLE "public"."families";

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."OrganizationType" NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_inviteCode_key" ON "public"."organizations"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_userId_organizationId_key" ON "public"."organization_memberships"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_signups_userId_organizationId_date_key" ON "public"."meal_signups"("userId", "organizationId", "date");

-- AddForeignKey
ALTER TABLE "public"."organization_memberships" ADD CONSTRAINT "organization_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_memberships" ADD CONSTRAINT "organization_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_lastSelectedOrganizationId_fkey" FOREIGN KEY ("lastSelectedOrganizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meal_signups" ADD CONSTRAINT "meal_signups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
