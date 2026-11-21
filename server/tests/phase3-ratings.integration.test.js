import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhase3FixtureSet } from './fixtures/phase3-fixtures.js';
import { prisma } from '../src/config/db.js';
import {
  RATING_CATEGORIES,
  RATING_MIN,
  RATING_MAX,
  createUniversityReview,
  getAuthoritativeUniversityAggregates,
  listUniversityReviews,
} from '../src/services/universityRatingService.js';

const ratings = {
  academics: 5,
  facilities: 4,
  campus_life: 3,
  value: 4,
};

test('Phase 3 verified rating trace produces public authoritative aggregates', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'ratings-trace' });
  try {
    const review = await createUniversityReview({
      universitySlug: fixture.university.slug,
      userId: fixture.user.id,
      text: 'A useful public review',
      ratings,
    });

    assert.equal(review.author.email, undefined);
    assert.equal(review.author.supabaseUserId, undefined);
    assert.equal(review.ratings.academics, 5);

    const aggregates = await getAuthoritativeUniversityAggregates({
      universitySlug: fixture.university.slug,
    });
    assert.equal(aggregates.reviewCount, 1);
    assert.equal(aggregates.overall, 4);
    assert.equal(aggregates.categories.academics.average, 5);
    assert.equal(aggregates.categories.academics.count, 1);

    const publicData = await listUniversityReviews({ universitySlug: fixture.university.slug });
    assert.equal(publicData.reviews.length, 1);
    assert.equal(publicData.reviews[0].author.email, undefined);
  } finally {
    await fixture.cleanup();
  }
});

test('Phase 3 guest, verified non-member, verified member, and admin rating authorization', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'ratings-matrix' });
  try {
    await assert.rejects(
      createUniversityReview({
        universitySlug: fixture.university.slug,
        userId: null,
        text: 'Guest',
        ratings,
      }),
      (error) => error.status === 401,
    );

    await prisma.communityMembership.deleteMany({
      where: { userId: fixture.user.id, universityId: fixture.university.id },
    });
    const nonMemberReview = await createUniversityReview({
      universitySlug: fixture.university.slug,
      userId: fixture.user.id,
      text: 'Verified non-member',
      ratings,
    });
    assert.equal(nonMemberReview.author.id, fixture.user.id);

    await prisma.communityMembership.create({
      data: { userId: fixture.user.id, universityId: fixture.university.id },
    });
    await assert.rejects(
      createUniversityReview({
        universitySlug: fixture.university.slug,
        userId: fixture.user.id,
        text: 'Duplicate member review',
        ratings,
      }),
      (error) => error.status === 409,
    );

    const admin = await prisma.user.update({
      where: { id: fixture.secondaryUser.id },
      data: { role: 'admin', verificationStatus: 'unverified' },
    });
    await assert.rejects(
      createUniversityReview({
        universitySlug: fixture.university.slug,
        userId: admin.id,
        text: 'Unverified admin',
        ratings,
      }),
      (error) => error.status === 403,
    );
    await prisma.user.update({
      where: { id: admin.id },
      data: { verificationStatus: 'verified' },
    });
    const verifiedAdminReview = await createUniversityReview({
      universitySlug: fixture.university.slug,
      userId: admin.id,
      text: 'Verified admin',
      ratings,
    });
    assert.equal(verifiedAdminReview.author.id, admin.id);
  } finally {
    await fixture.cleanup();
  }
});

test('Phase 3 review authorization matrix, duplicate uniqueness, validation, and university scope', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'ratings-authorization' });
  const other = await createPhase3FixtureSet({ label: 'ratings-other-university' });
  try {
    await assert.rejects(
      createUniversityReview({
        universitySlug: fixture.university.slug,
        userId: fixture.secondaryUser.id,
        text: 'Unverified review',
        ratings,
      }),
      (error) => error.status === 403,
    );

    await assert.rejects(
      createUniversityReview({
        universitySlug: fixture.university.slug,
        userId: fixture.user.id,
        text: 'Invalid category',
        ratings: { ...ratings, sports: 5 },
      }),
      (error) => error.status === 400,
    );
    await assert.rejects(
      createUniversityReview({
        universitySlug: fixture.university.slug,
        userId: fixture.user.id,
        text: 'Invalid scale',
        ratings: { ...ratings, academics: RATING_MAX + 1 },
      }),
      (error) => error.status === 400,
    );

    await createUniversityReview({
      universitySlug: fixture.university.slug,
      userId: fixture.user.id,
      text: 'First review',
      ratings,
    });

    await assert.rejects(
      createUniversityReview({
        universitySlug: fixture.university.slug,
        userId: fixture.user.id,
        text: 'Second review',
        ratings,
      }),
      (error) => error.status === 409,
    );

    const otherReview = await createUniversityReview({
      universitySlug: other.university.slug,
      userId: other.user.id,
      text: 'Other university',
      ratings,
    });
    assert.notEqual(otherReview.author.id, fixture.user.id);

    const crossUniversity = await prisma.universityReview.findFirst({
      where: { id: otherReview.id, universityId: fixture.university.id },
    });
    assert.equal(crossUniversity, null);
  } finally {
    await other.cleanup();
    await fixture.cleanup();
  }
});

test('Phase 3 migration preservation: review and rating constraints remain unique and foreign-key scoped', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'ratings-migration' });
  try {
    const review = await prisma.universityReview.create({
      data: {
        universityId: fixture.university.id,
        userId: fixture.user.id,
        text: 'Migration constraint review',
      },
    });

    await assert.rejects(
      prisma.universityReview.create({
        data: {
          universityId: fixture.university.id,
          userId: fixture.user.id,
          text: 'Duplicate persisted review',
        },
      }),
      (error) => error.code === 'P2002',
    );

    await assert.rejects(
      prisma.universityRating.create({
        data: {
          reviewId: review.id,
          universityId: fixture.university.id,
          category: RATING_CATEGORIES[0],
          score: RATING_MAX + 1,
        },
      }),
      (error) => error.code === 'P2000' || error.code === 'P2010' || error.message.includes('check constraint'),
    );

    assert.equal(RATING_MIN, 1);
  } finally {
    await fixture.cleanup();
  }
});
