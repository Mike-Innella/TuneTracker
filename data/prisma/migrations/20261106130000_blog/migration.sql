-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterEnum
ALTER TYPE "ReportTarget" ADD VALUE 'ARTICLE';

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "coverId" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Article_category_status_idx" ON "Article"("category", "status");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- RLS on the new public table (no policies: Prisma is the only data path)
ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;
