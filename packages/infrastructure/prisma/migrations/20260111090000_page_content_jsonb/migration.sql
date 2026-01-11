-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "content" DROP DEFAULT;

ALTER TABLE "pages" ALTER COLUMN "content" TYPE JSONB USING
  CASE
    WHEN "content" IS NULL OR "content" = '' THEN '[]'::jsonb
    ELSE "content"::jsonb
  END;

ALTER TABLE "pages" ALTER COLUMN "content" SET DEFAULT '[]'::jsonb;
