import { prisma } from '../config/db.js';
import { isValidUsername, normalizeUsername } from '../validators/profileValidators.js';

export async function getUserProfileByUsername(username) {
  const normalized = normalizeUsername(username);

  if (!normalized || !isValidUsername(normalized)) {
    return null;
  }

  const profile = await prisma.userProfile.findUnique({
    where: {
      username: normalized,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: false,
          role: false,
          verificationStatus: false,
          supabaseUserId: false,
          authMetadata: false,
          lastLoginAt: false,
          lastLoginIp: false,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    user: {
      id: profile.user.id,
      name: profile.user.name,
      createdAt: profile.user.createdAt,
    },
  };
}

export async function getUserProfileByUserId(userId) {
  if (!userId) {
    return null;
  }

  const profile = await prisma.userProfile.findUnique({
    where: {
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    user: {
      id: profile.user.id,
      name: profile.user.name,
      createdAt: profile.user.createdAt,
    },
  };
}

export async function createUserProfile({ userId, username, displayName, bio, avatarUrl }) {
  const normalized = normalizeUsername(username);

  if (!normalized || !isValidUsername(normalized)) {
    throw new Error('Invalid username.');
  }

  if (!userId || !displayName) {
    throw new Error('userId and displayName are required.');
  }

  const existing = await prisma.userProfile.findUnique({
    where: {
      username: normalized,
    },
  });

  if (existing) {
    throw new Error('Username already taken.');
  }

  let profile;
  try {
    profile = await prisma.userProfile.create({
      data: {
        userId,
        username: normalized,
        displayName,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new Error('Username already taken.');
    }
    throw error;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    user: {
      id: profile.user.id,
      name: profile.user.name,
      createdAt: profile.user.createdAt,
    },
  };
}
