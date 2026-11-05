-- CreateEnum
CREATE TYPE "TrackKind" AS ENUM ('TRACK', 'SAMPLE');

-- CreateEnum
CREATE TYPE "TrackStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TrackVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "UsageRights" AS ENUM ('ALL_RIGHTS_RESERVED', 'ROYALTY_FREE_NON_COMMERCIAL', 'ROYALTY_FREE_COMMERCIAL', 'CC_BY', 'CC_BY_NC');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "trackId" TEXT;

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "kind" "TrackKind" NOT NULL DEFAULT 'TRACK',
    "status" "TrackStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "TrackVisibility" NOT NULL DEFAULT 'PUBLIC',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT,
    "tags" TEXT[],
    "links" TEXT[],
    "credits" JSONB NOT NULL DEFAULT '[]',
    "bpm" INTEGER,
    "musicalKey" TEXT,
    "durationSec" DOUBLE PRECISION,
    "audioId" TEXT,
    "artworkId" TEXT,
    "downloadable" BOOLEAN NOT NULL DEFAULT false,
    "usageRights" "UsageRights",
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackLike" (
    "trackId" TEXT NOT NULL,
    "profileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackLike_pkey" PRIMARY KEY ("trackId","profileId")
);

-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "listenerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Track_status_visibility_publishedAt_idx" ON "Track"("status", "visibility", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Track_ownerId_status_idx" ON "Track"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Track_kind_status_genre_idx" ON "Track"("kind", "status", "genre");

-- CreateIndex
CREATE INDEX "TrackLike_profileId_idx" ON "TrackLike"("profileId");

-- CreateIndex
CREATE INDEX "Play_trackId_createdAt_idx" ON "Play"("trackId", "createdAt");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLike" ADD CONSTRAINT "TrackLike_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLike" ADD CONSTRAINT "TrackLike_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_listenerId_fkey" FOREIGN KEY ("listenerId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- RLS on new public tables (no policies: Prisma is the only data path)
ALTER TABLE "Track" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrackLike" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Play" ENABLE ROW LEVEL SECURITY;

-- Data migration (reversible: Post.audioId is kept). Every post that carried audio gets a
-- published, public Track owned by its author, and the post embeds it.
WITH src AS (
  SELECT p."id" AS post_id, 'trk_' || p."id" AS track_id, p."authorId", p."title", p."body", p."genre",
         p."tags", p."links", p."audioId", p."createdAt", a."durationSec", a."title" AS asset_title,
         p."imageId"
  FROM "Post" p JOIN "MediaAsset" a ON a."id" = p."audioId"
  WHERE p."trackId" IS NULL
)
INSERT INTO "Track" ("id", "ownerId", "kind", "status", "visibility", "title", "description", "genre",
                     "tags", "links", "credits", "durationSec", "audioId", "artworkId", "publishedAt",
                     "createdAt", "updatedAt")
SELECT track_id, "authorId", 'TRACK', 'PUBLISHED', 'PUBLIC', COALESCE(asset_title, "title"), "body", "genre",
       "tags", "links", '[]'::jsonb, "durationSec", "audioId", "imageId", "createdAt", "createdAt", now()
FROM src;
UPDATE "Post" SET "trackId" = 'trk_' || "id" WHERE "audioId" IS NOT NULL AND "trackId" IS NULL
  AND EXISTS (SELECT 1 FROM "Track" t WHERE t."id" = 'trk_' || "Post"."id");
