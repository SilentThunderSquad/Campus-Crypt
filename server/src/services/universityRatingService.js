import { prisma } from '../config/db.js';
import { findUniversityBySlug } from './universityService.js';

export const RATING_CATEGORIES = Object.freeze([
  'academics',
  'facilities',
  'campus_life',
  'value',
]);
export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const REVIEW_TEXT_MAX_LENGTH = 5000;

export const publicReviewer = {
  id: true,
  name: true,
  profile: { select: { username: true, displayName: true, avatarUrl: true } },
};

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeText(text) {
  if (text == null || String(text).trim() === '') return null;
  const value = String(text).trim();
  if (value.length > REVIEW_TEXT_MAX_LENGTH) {
    throw httpError(400, `Review text must be at most ${REVIEW_TEXT_MAX_LENGTH} characters.`);
  }
  return value;
}

function normalizeRatings(ratings) {
  if (!ratings || typeof ratings !== 'object' || Array.isArray(ratings)) {
    throw httpError(400, 'Ratings must contain the fixed category score set.');
  }

  const keys = Object.keys(ratings).sort();
  const expected = [...RATING_CATEGORIES].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw httpError(400, `Ratings must include exactly these categories: ${RATING_CATEGORIES.join(', ')}.`);
  }

  return RATING_CATEGORIES.map((category) => {
    const score = ratings[category];
    if (!Number.isInteger(score) || score < RATING_MIN || score > RATING_MAX) {
      throw httpError(400, `Each rating must be an integer between ${RATING_MIN} and ${RATING_MAX}.`);
    }
    return { category, score };
  });
}

async function currentUser(userId) {
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, verificationStatus: true, role: true },
  });
}

export async function createUniversityReview({ universitySlug, userId, text, ratings }) {
  const [university, user] = await Promise.all([
    findUniversityBySlug(universitySlug),
    currentUser(userId),
  ]);

  if (!university) throw httpError(404, 'University not found.');
  if (!user) throw httpError(401, 'Authentication required.');
  if (user.verificationStatus !== 'verified') {
    throw httpError(403, 'Verified users are required to submit university reviews.');
  }

  const normalizedText = normalizeText(text);
  const normalizedRatings = normalizeRatings(ratings);

  try {
    return await prisma.$transaction(async (tx) => {
      const review = await tx.universityReview.create({
        data: {
          universityId: university.id,
          userId: user.id,
          text: normalizedText,
        },
      });

      await tx.universityRating.createMany({
        data: normalizedRatings.map((rating) => ({
          reviewId: review.id,
          universityId: university.id,
          category: rating.category,
          score: rating.score,
        })),
      });
      const persisted = await tx.universityReview.findUnique({
        where: { id: review.id },
        include: {
          user: { select: publicReviewer },
          ratings: { select: { category: true, score: true } },
        },
      });
      return persisted ? serializeReview(persisted) : null;
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw httpError(409, 'A review for this university already exists for this user.');
    }
    if (error?.code === 'P2003') {
      throw httpError(400, 'The university or reviewer is invalid.');
    }
    throw error;
  }
}

export async function getUniversityReviewById({ universitySlug, reviewId }) {
  const university = await findUniversityBySlug(universitySlug);
  if (!university) return null;

  const review = await prisma.universityReview.findFirst({
    where: { id: reviewId, universityId: university.id },
    include: {
      user: { select: publicReviewer },
      ratings: { select: { category: true, score: true } },
    },
  });
  return review ? serializeReview(review) : null;
}

export async function listUniversityReviews({ universitySlug }) {
  const university = await findUniversityBySlug(universitySlug);
  if (!university) return null;

  const reviews = await prisma.universityReview.findMany({
    where: { universityId: university.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: publicReviewer },
      ratings: { select: { category: true, score: true } },
    },
  });

  return {
    university: { id: university.id, name: university.name, slug: university.slug },
    reviews: reviews.map(serializeReview),
  };
}

export async function getAuthoritativeUniversityAggregates({ universitySlug }) {
  const university = await findUniversityBySlug(universitySlug);
  if (!university) return null;

  const reviews = await prisma.universityReview.count({ where: { universityId: university.id } });
  const ratings = await prisma.universityRating.findMany({
    where: { universityId: university.id },
    select: { category: true, score: true },
  });

  const categories = {};
  for (const category of RATING_CATEGORIES) {
    const values = ratings.filter((rating) => rating.category === category);
    categories[category] = {
      average: values.length
        ? Number((values.reduce((sum, rating) => sum + rating.score, 0) / values.length).toFixed(2))
        : null,
      count: values.length,
    };
  }

  const allScores = ratings.map((rating) => rating.score);
  const overall = allScores.length
    ? Number((allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(2))
    : null;

  return {
    university: { id: university.id, name: university.name, slug: university.slug },
    reviewCount: reviews,
    ratingCount: allScores.length,
    overall,
    categories,
  };
}

export function serializeReview(review) {
  const ratings = {};
  for (const rating of review.ratings ?? []) ratings[rating.category] = rating.score;
  return {
    id: review.id,
    text: review.text,
    createdAt: review.createdAt,
    ratings,
    author: review.user,
  };
}
