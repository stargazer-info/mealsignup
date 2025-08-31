/*
  Warnings:

  - You are about to drop the `user_preferences` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_preferences" DROP CONSTRAINT "user_preferences_lastSelectedOrganizationId_fkey";

-- AlterTable
ALTER TABLE "public"."organization_memberships" ADD COLUMN     "isLastSelected" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."user_preferences";
