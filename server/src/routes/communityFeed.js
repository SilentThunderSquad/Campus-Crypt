import { Router } from 'express';
import { getUserFromRequest } from '../services/authService.js';
import { getFeedForUniversity } from '../services/communityFeedService.js';
import {
  normalizeUniversitySlug,
  isValidUniversitySlug,
} from '../validators/universityValidators.js';

const router = Router();

/**
 * GET /api/universities/:slug/feed
 *
 * Returns the community feed for a university.
 *
 * Public endpoint: Guests and authenticated users can access.
 *
 * Authorization:
 * - Guests: Can view public feed (empty in Phase 2)
 * - Authenticated unverified: Can view public feed
 * - Verified: Can view community feed if member
 * - Admin: Can view all feed content
 *
 * Response: { ok, university, items }
 */
router.get('/:slug/feed', async (req, res) => {
  const slug = normalizeUniversitySlug(req.params.slug);

  if (!isValidUniversitySlug(slug)) {
    return res.status(400).json({
      ok: false,
      message: 'University slug must be a valid URL-safe identifier.',
    });
  }

  try {
    const user = await getUserFromRequest(req);

    const feedResult = await getFeedForUniversity({ universitySlug: slug, user });

    if (!feedResult) {
      return res.status(404).json({
        ok: false,
        message: 'University not found.',
      });
    }

    if (feedResult.authorizationError) {
      return res.status(403).json({
        ok: false,
        message: 'You are not authorized to read this community feed.',
      });
    }

    return res.json(feedResult);
  } catch (error) {
    console.error('Error fetching community feed:', error);
    return res.status(500).json({
      ok: false,
      message: 'Unable to fetch community feed.',
    });
  }
});

export default router;
