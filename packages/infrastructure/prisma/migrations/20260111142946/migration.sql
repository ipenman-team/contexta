-- AlterTable
ALTER TABLE "page_versions" ALTER COLUMN "content" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "content" DROP DEFAULT;
