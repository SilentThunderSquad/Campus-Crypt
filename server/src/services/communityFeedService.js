import { findUniversityBySlug, normalizeUniversitySlug, isValidUniversitySlug } from './universityService.js';

export function canReadPublicCommunityFeed({ user } = {}) {
  // The current schema has no explicit account restriction field or feed-read restriction.
  // Feed reading is public; membership and verification govern later interactions.
  return true;
}

/**
 * Get the community feed for a university.
 *
 * Phase 2 implementation: Returns an empty feed since Phase 3+ content systems
 * (posts, discussions, reviews, Q&A) do not yet exist.
 *
 * This service is designed to aggregate content from future systems:
 * - Posts (Phase 3)
 * - Discussions (Phase 3)
 * - Reviews (Phase 3)
 * - Q&A (Phase 3)
 *
 * The approved Phase 2 policy allows public reads for every auth state. The user is
 * still resolved by the route so future interaction permissions remain backend-owned.
 */
export async function getFeedForUniversity({ universitySlug, user }) {
  const normalizedSlug = normalizeUniversitySlug(universitySlug);

  if (!normalizedSlug || !isValidUniversitySlug(normalizedSlug)) {
    throw new Error('Invalid university slug.');
  }

  const university = await findUniversityBySlug(normalizedSlug);

  if (!university) {
    return null;
  }

  if (!canReadPublicCommunityFeed({ user })) {
    return {
      ok: false,
      authorizationError: true,
    };
  }

  // Phase 2: Return empty feed.
  // Phase 3+ systems (posts, discussions, reviews, Q&A) will populate this.
  const items = [];

  return {
    ok: true,
    university: {
      id: university.id,
      name: university.name,
      slug: university.slug,
      description: university.description,
    },
    items,
  };
}
