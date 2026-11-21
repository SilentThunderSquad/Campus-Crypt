import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/db.js';

let fixtureSequence = 0;

export function createPhase3ReservedIds() {
  return {
    postId: randomUUID(),
    commentId: randomUUID(),
    reviewId: randomUUID(),
    ratingId: randomUUID(),
  };
}

export async function createPhase3FixtureSet({
  label = 'migration-preservation',
  verificationStatus = 'verified',
  role = 'student',
} = {}) {
  fixtureSequence += 1;
  const suffix = `${Date.now()}-${process.pid}-${fixtureSequence}-${randomUUID().slice(0, 8)}`;
  const prefix = `phase3-${label}-${suffix}`.toLowerCase();

  const university = await prisma.university.create({
    data: {
      name: `Phase 3 ${label} University`,
      slug: `${prefix}-university`,
      description: 'Isolated Phase 3 migration-preservation fixture',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: `${prefix}-primary@campuscrypt.dev`,
      name: 'Phase 3 Primary Fixture',
      role,
      verificationStatus,
      provider: 'google',
      supabaseUserId: `${prefix}-supabase-primary`,
    },
  });

  const secondaryUser = await prisma.user.create({
    data: {
      email: `${prefix}-secondary@campuscrypt.dev`,
      name: 'Phase 3 Secondary Fixture',
      role: 'student',
      verificationStatus: 'unverified',
      provider: 'google',
      supabaseUserId: `${prefix}-supabase-secondary`,
    },
  });

  const authIdentity = await prisma.authIdentity.create({
    data: {
      userId: user.id,
      provider: 'google',
      providerUserId: `${prefix}-identity-primary`,
      email: user.email,
      displayName: user.name,
    },
  });

  const secondaryAuthIdentity = await prisma.authIdentity.create({
    data: {
      userId: secondaryUser.id,
      provider: 'google',
      providerUserId: `${prefix}-identity-secondary`,
      email: secondaryUser.email,
      displayName: secondaryUser.name,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: `phase3-${suffix}-token-primary`,
      userAgent: 'Phase 3 isolated fixture',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const secondarySession = await prisma.session.create({
    data: {
      userId: secondaryUser.id,
      tokenHash: `phase3-${suffix}-token-secondary`,
      userAgent: 'Phase 3 isolated fixture',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const usernameToken = `${fixtureSequence}-${randomUUID().slice(0, 8)}`;
  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id,
      username: `phase3p${usernameToken}`,
      displayName: 'Phase 3 Primary Profile',
      bio: 'Isolated migration-preservation fixture',
    },
  });

  const secondaryProfile = await prisma.userProfile.create({
    data: {
      userId: secondaryUser.id,
      username: `phase3s${usernameToken}`,
      displayName: 'Phase 3 Secondary Profile',
      bio: 'Isolated migration-preservation fixture',
    },
  });

  const membership = await prisma.communityMembership.create({
    data: {
      userId: user.id,
      universityId: university.id,
    },
  });

  const reservedIds = createPhase3ReservedIds();
  const ids = {
    universityId: university.id,
    userId: user.id,
    secondaryUserId: secondaryUser.id,
  };

  let cleaned = false;
  return {
    prefix,
    university,
    user,
    secondaryUser,
    authIdentity,
    secondaryAuthIdentity,
    session,
    secondarySession,
    profile,
    secondaryProfile,
    membership,
    reservedIds,
    ids,
    async cleanup() {
      if (cleaned) {
        return;
      }
      cleaned = true;
      await prisma.communityMembership.deleteMany({
        where: { universityId: university.id },
      });
      await prisma.userProfile.deleteMany({
        where: { userId: { in: [user.id, secondaryUser.id] } },
      });
      await prisma.session.deleteMany({
        where: { userId: { in: [user.id, secondaryUser.id] } },
      });
      await prisma.authIdentity.deleteMany({
        where: { userId: { in: [user.id, secondaryUser.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, secondaryUser.id] } },
      });
      await prisma.university.deleteMany({
        where: { id: university.id },
      });
    },
  };
}
