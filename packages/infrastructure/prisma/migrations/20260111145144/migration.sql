-- AlterTable
ALTER TABLE "page_versions" ALTER COLUMN "created_by" DROP DEFAULT,
ALTER COLUMN "updated_by" DROP DEFAULT;

-- AlterTable
ALTER TABLE "pages" ALTER COLUMN "created_by" DROP DEFAULT,
ALTER COLUMN "updated_by" DROP DEFAULT;
