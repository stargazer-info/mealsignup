/*
  Warnings:

  - You are about to drop the column `userId` on the `meal_signups` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `organization_memberships` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clerkId,organizationId,date]` on the table `meal_signups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clerkId,organizationId]` on the table `organization_memberships` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clerkId` to the `meal_signups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clerkId` to the `organization_memberships` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."meal_signups" DROP CONSTRAINT "meal_signups_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."organization_memberships" DROP CONSTRAINT "organization_memberships_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_lastSelectedOrganizationId_fkey";

-- DropIndex
DROP INDEX "public"."meal_signups_userId_organizationId_date_key";

-- DropIndex
DROP INDEX "public"."organization_memberships_userId_organizationId_key";

-- AlterTable
ALTER TABLE "public"."meal_signups" DROP COLUMN "userId",
ADD COLUMN     "clerkId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."organization_memberships" DROP COLUMN "userId",
ADD COLUMN     "clerkId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."users";

-- CreateTable
CREATE TABLE "public"."user_preferences" (
    "clerkId" TEXT NOT NULL,
    "lastSelectedOrganizationId" TEXT,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("clerkId")
);

-- CreateIndex
CREATE UNIQUE INDEX "meal_signups_clerkId_organizationId_date_key" ON "public"."meal_signups"("clerkId", "organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_clerkId_organizationId_key" ON "public"."organization_memberships"("clerkId", "organizationId");

-- AddForeignKey
ALTER TABLE "public"."user_preferences" ADD CONSTRAINT "user_preferences_lastSelectedOrganizationId_fkey" FOREIGN KEY ("lastSelectedOrganizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
