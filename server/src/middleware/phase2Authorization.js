import { prisma } from '../config/db.js';
import { findUniversityBySlug } from '../services/universityService.js';

// Account restrictions cannot be enforced here because the current Prisma schema
// has no restriction, ban, suspension, or blocked-user model or service.
export async function requireUniversityMember(req, res, next) {
  const universitySlug = req.params?.slug;

  if (!req.user) {
    return res.status(401).json({
      ok: false,
      message: 'Authentication required to access this community resource.',
    });
  }

  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({
      ok: false,
      message: 'Verified users are required to access this community resource.',
    });
  }

  try {
    const university = await findUniversityBySlug(universitySlug);

    if (!university) {
      return res.status(404).json({
        ok: false,
        message: 'University not found.',
      });
    }

    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_universityId: {
          userId: req.user.id,
          universityId: university.id,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return res.status(403).json({
        ok: false,
        message: 'University community membership is required.',
      });
    }

    req.university = university;
    return next();
  } catch {
    return res.status(500).json({
      ok: false,
      message: 'Unable to verify university community membership.',
    });
  }
}
