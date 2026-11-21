import { Router } from 'express';
import { requireAuth, requireVerifiedUser } from '../middleware/auth.js';
import {
  createUniversityReview,
  getAuthoritativeUniversityAggregates,
  getUniversityReviewById,
  listUniversityReviews,
} from '../services/universityRatingService.js';

const router = Router();

router.get('/:slug/reviews', async (req, res) => {
  try {
    const [reviewData, aggregates] = await Promise.all([
      listUniversityReviews({ universitySlug: req.params.slug }),
      getAuthoritativeUniversityAggregates({ universitySlug: req.params.slug }),
    ]);
    if (!reviewData || !aggregates) {
      return res.status(404).json({ ok: false, message: 'University not found.' });
    }
    return res.json({
      ok: true,
      university: reviewData.university,
      reviews: reviewData.reviews,
      aggregates: {
        reviewCount: aggregates.reviewCount,
        ratingCount: aggregates.ratingCount,
        overall: aggregates.overall,
        categories: aggregates.categories,
      },
    });
  } catch {
    return res.status(500).json({ ok: false, message: 'Unable to load university reviews.' });
  }
});

router.post('/:slug/reviews', requireAuth, requireVerifiedUser, async (req, res) => {
  try {
    const review = await createUniversityReview({
      universitySlug: req.params.slug,
      userId: req.user.id,
      text: req.body?.text,
      ratings: req.body?.ratings,
    });
    return res.status(201).json({ ok: true, review });
  } catch (error) {
    return res.status(error.status ?? 500).json({
      ok: false,
      message: error.status ? error.message : 'Unable to submit university review.',
    });
  }
});

router.get('/:slug/reviews/:reviewId', async (req, res) => {
  const review = await getUniversityReviewById({
    universitySlug: req.params.slug,
    reviewId: req.params.reviewId,
  });
  if (!review) return res.status(404).json({ ok: false, message: 'Review not found.' });
  return res.json({ ok: true, review });
});

export default router;
