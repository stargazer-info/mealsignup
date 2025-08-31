/*
  Warnings:

  - You are about to drop the column `type` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."organizations" DROP COLUMN "type";

-- DropEnum
DROP TYPE "public"."OrganizationType";
