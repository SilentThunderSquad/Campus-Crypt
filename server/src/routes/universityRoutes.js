import { Router } from 'express';
import {
  findUniversityBySlug,
  listUniversities,
} from '../services/universityService.js';
import {
  isValidUniversitySlug,
  normalizeUniversitySlug,
} from '../validators/universityValidators.js';
import { getAuthoritativeUniversityAggregates } from '../services/universityRatingService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const universities = await listUniversities();
    return res.json({
      ok: true,
      universities: universities.map(({ memberships, ...university }) => ({
        ...university,
        memberCount: memberships.length,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Unable to load university directory.',
    });
  }
});

router.get('/:slug', async (req, res) => {
  const slug = normalizeUniversitySlug(req.params.slug);

  if (!isValidUniversitySlug(slug)) {
    return res.status(400).json({
      ok: false,
      message: 'University slug must be a valid URL-safe identifier.',
    });
  }

  const university = await findUniversityBySlug(slug);

  if (!university) {
    return res.status(404).json({
      ok: false,
      message: 'University not found.',
    });
  }

  const { memberships, ...publicUniversity } = university;
  const aggregates = await getAuthoritativeUniversityAggregates({ universitySlug: slug });
  return res.json({
    ok: true,
    university: {
      ...publicUniversity,
      memberCount: memberships.length,
      aggregates,
    },
  });
});

export default router;
