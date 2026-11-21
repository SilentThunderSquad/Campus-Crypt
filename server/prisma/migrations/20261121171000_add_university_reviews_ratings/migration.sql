CREATE TYPE "RatingCategory" AS ENUM ('academics', 'facilities', 'campus_life', 'value');

CREATE TABLE "university_reviews" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "university_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "university_ratings" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "category" "RatingCategory" NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "university_ratings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "university_reviews_userId_universityId_key"
  ON "university_reviews"("userId", "universityId");
CREATE INDEX "university_reviews_universityId_createdAt_idx"
  ON "university_reviews"("universityId", "createdAt");
CREATE UNIQUE INDEX "university_ratings_reviewId_category_key"
  ON "university_ratings"("reviewId", "category");
CREATE INDEX "university_ratings_universityId_category_idx"
  ON "university_ratings"("universityId", "category");

ALTER TABLE "university_reviews"
  ADD CONSTRAINT "university_reviews_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "universities"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_reviews"
  ADD CONSTRAINT "university_reviews_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_ratings"
  ADD CONSTRAINT "university_ratings_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "university_reviews"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "university_ratings"
  ADD CONSTRAINT "university_ratings_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "universities"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "university_ratings"
  ADD CONSTRAINT "university_ratings_score_check"
  CHECK ("score" BETWEEN 1 AND 5);
