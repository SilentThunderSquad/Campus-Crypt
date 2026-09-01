import { prisma } from '../config/db.js';
import { findUniversityBySlug } from './universityService.js';

export async function getUniversityMembershipStatus({ user, universitySlug }) {
  const university = await findUniversityBySlug(universitySlug);

  if (!university) {
    return {
      university: null,
      isMember: false,
      canJoin: false,
      canLeave: false,
      isAuthenticated: false,
    };
  }

  if (!user) {
    return {
      university: {
        id: university.id,
        name: university.name,
        slug: university.slug,
      },
      isMember: false,
      canJoin: false,
      canLeave: false,
      isAuthenticated: false,
    };
  }

  const membership = await prisma.communityMembership.findUnique({
    where: {
      userId_universityId: {
        userId: user.id,
        universityId: university.id,
      },
    },
  });

  const isMember = Boolean(membership);

  return {
    university: {
      id: university.id,
      name: university.name,
      slug: university.slug,
    },
    isMember,
    canJoin: user.verificationStatus === 'verified' && !isMember,
    canLeave: user.verificationStatus === 'verified' && isMember,
    isAuthenticated: true,
  };
}

export async function joinUniversity({ user, universitySlug }) {
  if (!user) {
    throw new Error('Authentication required to join a university community.');
  }

  if (user.verificationStatus !== 'verified') {
    throw new Error('Verified users are required to join a university community.');
  }

  const university = await findUniversityBySlug(universitySlug);
  if (!university) {
    throw new Error('University not found.');
  }

  const existingMembership = await prisma.communityMembership.findUnique({
    where: {
      userId_universityId: {
        userId: user.id,
        universityId: university.id,
      },
    },
  });

  if (existingMembership) {
    return {
      membership: existingMembership,
      university,
      alreadyJoined: true,
    };
  }

  const membership = await prisma.communityMembership.create({
    data: {
      userId: user.id,
      universityId: university.id,
    },
  });

  return {
    membership,
    university,
    alreadyJoined: false,
  };
}

export async function leaveUniversity({ user, universitySlug }) {
  if (!user) {
    throw new Error('Authentication required to leave a university community.');
  }

  if (user.verificationStatus !== 'verified') {
    throw new Error('Verified users are required to leave a university community.');
  }

  const university = await findUniversityBySlug(universitySlug);
  if (!university) {
    throw new Error('University not found.');
  }

  const deletion = await prisma.communityMembership.deleteMany({
    where: {
      userId: user.id,
      universityId: university.id,
    },
  });

  return {
    university,
    deletedCount: deletion.count,
  };
}
