-- AddColumns
ALTER TABLE "pages" ADD COLUMN "created_by" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "pages" ADD COLUMN "updated_by" TEXT NOT NULL DEFAULT 'system';

ALTER TABLE "page_versions" ADD COLUMN "created_by" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "page_versions" ADD COLUMN "updated_by" TEXT NOT NULL DEFAULT 'system';
