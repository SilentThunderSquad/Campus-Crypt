import { Router } from 'express';
import { getUserFromRequest } from '../services/authService.js';
import {
  getUniversityMembershipStatus,
  joinUniversity,
  leaveUniversity,
} from '../services/communityMembershipService.js';
import { normalizeUniversitySlug, isValidUniversitySlug } from '../services/universityService.js';

const router = Router();

router.get('/:slug/membership-status', async (req, res) => {
  const slug = normalizeUniversitySlug(req.params.slug);

  if (!isValidUniversitySlug(slug)) {
    return res.status(400).json({
      ok: false,
      message: 'University slug must be a valid URL-safe identifier.',
    });
  }

  const user = req.user ?? (await getUserFromRequest(req));
  const status = await getUniversityMembershipStatus({ user, universitySlug: slug });

  if (!status.university) {
    return res.status(404).json({
      ok: false,
      message: 'University not found.',
    });
  }

  return res.json({
    ok: true,
    university: status.university,
    membershipStatus: {
      isMember: status.isMember,
      canJoin: status.canJoin,
      canLeave: status.canLeave,
      isAuthenticated: status.isAuthenticated,
    },
  });
});

router.post('/:slug/join', async (req, res) => {
  const slug = normalizeUniversitySlug(req.params.slug);

  if (!isValidUniversitySlug(slug)) {
    return res.status(400).json({
      ok: false,
      message: 'University slug must be a valid URL-safe identifier.',
    });
  }

  const user = await getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: 'Authentication required to join a university community.',
    });
  }

  if (user.verificationStatus !== 'verified') {
    return res.status(403).json({
      ok: false,
      message: 'Verified users are required to join a university community.',
    });
  }

  try {
    const result = await joinUniversity({ user, universitySlug: slug });

    if (result.alreadyJoined) {
      return res.status(409).json({
        ok: false,
        message: 'You are already a member of this university community.',
      });
    }

    return res.status(201).json({
      ok: true,
      message: 'University community membership created.',
      university: {
        id: result.university.id,
        name: result.university.name,
        slug: result.university.slug,
      },
      membership: result.membership,
    });
  } catch (error) {
    if (error.message === 'University not found.') {
      return res.status(404).json({
        ok: false,
        message: 'University not found.',
      });
    }

    return res.status(500).json({
      ok: false,
      message: 'Unable to join the university community.',
    });
  }
});

router.post('/:slug/leave', async (req, res) => {
  const slug = normalizeUniversitySlug(req.params.slug);

  if (!isValidUniversitySlug(slug)) {
    return res.status(400).json({
      ok: false,
      message: 'University slug must be a valid URL-safe identifier.',
    });
  }

  const user = await getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: 'Authentication required to leave a university community.',
    });
  }

  if (user.verificationStatus !== 'verified') {
    return res.status(403).json({
      ok: false,
      message: 'Verified users are required to leave a university community.',
    });
  }

  try {
    const result = await leaveUniversity({ user, universitySlug: slug });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        ok: false,
        message: 'You are not a member of this university community.',
      });
    }

    return res.json({
      ok: true,
      message: 'University community membership removed.',
      university: {
        id: result.university.id,
        name: result.university.name,
        slug: result.university.slug,
      },
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    if (error.message === 'University not found.') {
      return res.status(404).json({
        ok: false,
        message: 'University not found.',
      });
    }

    return res.status(500).json({
      ok: false,
      message: 'Unable to leave the university community.',
    });
  }
});

export default router;
