-- CreateEnum
CREATE TYPE "PageVersionStatus" AS ENUM ('DRAFT', 'TEMP', 'PUBLISHED');

-- CreateTable
CREATE TABLE "page_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "status" "PageVersionStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "parent_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_versions_id_idx" ON "page_versions"("id");

-- CreateIndex
CREATE INDEX "page_versions_tenant_id_idx" ON "page_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "page_versions_page_id_idx" ON "page_versions"("page_id");

-- CreateIndex
CREATE INDEX "page_versions_page_id_created_at_idx" ON "page_versions"("page_id", "created_at");

-- CreateIndex
CREATE INDEX "page_versions_page_id_status_idx" ON "page_versions"("page_id", "status");

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Defaults
ALTER TABLE "page_versions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
