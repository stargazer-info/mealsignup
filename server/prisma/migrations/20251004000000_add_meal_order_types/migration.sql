-- CreateTable
CREATE TABLE "meal_order_types" (
    "id" TEXT NOT NULL,

    CONSTRAINT "meal_order_types_pkey" PRIMARY KEY ("id")
);

-- Insert master data
INSERT INTO "meal_order_types" ("id") VALUES ('NONE'), ('NORMAL'), ('TAKEOUT');

-- Add new columns to meal_signups
ALTER TABLE "meal_signups" ADD COLUMN "breakfastOrderTypeId" TEXT;
ALTER TABLE "meal_signups" ADD COLUMN "lunchOrderTypeId" TEXT;
ALTER TABLE "meal_signups" ADD COLUMN "dinnerOrderTypeId" TEXT;

-- Migrate existing data: true -> NORMAL, false -> NONE
UPDATE "meal_signups" SET "breakfastOrderTypeId" = CASE WHEN "breakfast" = true THEN 'NORMAL' ELSE 'NONE' END;
UPDATE "meal_signups" SET "lunchOrderTypeId" = CASE WHEN "lunch" = true THEN 'NORMAL' ELSE 'NONE' END;
UPDATE "meal_signups" SET "dinnerOrderTypeId" = CASE WHEN "dinner" = true THEN 'NORMAL' ELSE 'NONE' END;

-- Make new columns NOT NULL
ALTER TABLE "meal_signups" ALTER COLUMN "breakfastOrderTypeId" SET NOT NULL;
ALTER TABLE "meal_signups" ALTER COLUMN "lunchOrderTypeId" SET NOT NULL;
ALTER TABLE "meal_signups" ALTER COLUMN "dinnerOrderTypeId" SET NOT NULL;

-- Drop old boolean columns
ALTER TABLE "meal_signups" DROP COLUMN "breakfast";
ALTER TABLE "meal_signups" DROP COLUMN "lunch";
ALTER TABLE "meal_signups" DROP COLUMN "dinner";

-- AddForeignKey
ALTER TABLE "meal_signups" ADD CONSTRAINT "meal_signups_breakfastOrderTypeId_fkey" FOREIGN KEY ("breakfastOrderTypeId") REFERENCES "meal_order_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_signups" ADD CONSTRAINT "meal_signups_lunchOrderTypeId_fkey" FOREIGN KEY ("lunchOrderTypeId") REFERENCES "meal_order_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_signups" ADD CONSTRAINT "meal_signups_dinnerOrderTypeId_fkey" FOREIGN KEY ("dinnerOrderTypeId") REFERENCES "meal_order_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
