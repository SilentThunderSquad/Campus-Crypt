import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

export const prisma = new PrismaClient();

const normalizeRole = (role) => {
  const value = String(role ?? 'student').trim().toLowerCase();
  if (['student', 'alumni', 'faculty', 'admin'].includes(value)) {
    return value;
  }
  return 'student';
};

const normalizeVerification = (verificationStatus) => {
  const value = String(verificationStatus ?? 'unverified').trim().toLowerCase();
  if (value === 'verified') {
    return 'verified';
  }
  return 'unverified';
};

const withProvider = (user) => {
  if (!user) {
    return null;
  }

  const primaryIdentity = user.authIdentities?.[0];
  return {
    ...user,
    provider: primaryIdentity?.provider ?? user.provider ?? 'google',
  };
};

export async function findUserByEmail(email) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { authIdentities: true },
  });

  return withProvider(user);
}

export async function findUserById(id) {
  if (!id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: String(id) },
    include: { authIdentities: true },
  });

  return withProvider(user);
}

export async function findUserBySupabaseUserId(supabaseUserId) {
  if (!supabaseUserId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseUserId: String(supabaseUserId) },
    include: { authIdentities: true },
  });

  return withProvider(user);
}

export async function findUserByProvider(provider, providerUserId) {
  const identity = await prisma.authIdentity.findUnique({
    where: {
      provider_providerUserId: {
        provider: String(provider ?? 'google').toLowerCase(),
        providerUserId: String(providerUserId ?? ''),
      },
    },
    include: { user: { include: { authIdentities: true } } },
  });

  return withProvider(identity?.user ?? null);
}

export async function upsertUser({
  email,
  name,
  role,
  verificationStatus,
  provider = 'google',
  providerUserId,
  supabaseUserId,
  authMetadata,
  lastLoginAt,
  lastLoginIp,
}) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('An email is required to create or update a user.');
  }

  let user = await findUserBySupabaseUserId(supabaseUserId) ?? await findUserByEmail(normalizedEmail);

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name ?? user.name,
        role: normalizeRole(role ?? user.role),
        verificationStatus: normalizeVerification(verificationStatus ?? user.verificationStatus),
        supabaseUserId: supabaseUserId ? String(supabaseUserId) : user.supabaseUserId ?? undefined,
        authMetadata: authMetadata ?? user.authMetadata ?? undefined,
        lastLoginAt: lastLoginAt ?? user.lastLoginAt ?? undefined,
        lastLoginIp: lastLoginIp ?? user.lastLoginIp ?? undefined,
      },
      include: { authIdentities: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name ?? 'Campus Crypt User',
        role: normalizeRole(role),
        verificationStatus: normalizeVerification(verificationStatus),
        provider: String(provider ?? 'google').toLowerCase(),
        supabaseUserId: supabaseUserId ? String(supabaseUserId) : null,
        authMetadata: authMetadata ?? undefined,
        lastLoginAt: lastLoginAt ?? undefined,
        lastLoginIp: lastLoginIp ?? undefined,
      },
      include: { authIdentities: true },
    });
  }

  if (providerUserId) {
    await prisma.authIdentity.upsert({
      where: {
        provider_providerUserId: {
          provider: String(provider ?? 'google').toLowerCase(),
          providerUserId: String(providerUserId),
        },
      },
      update: {
        userId: user.id,
        email: normalizedEmail,
        displayName: name ?? user.name,
      },
      create: {
        userId: user.id,
        provider: String(provider ?? 'google').toLowerCase(),
        providerUserId: String(providerUserId),
        email: normalizedEmail,
        displayName: name ?? user.name,
      },
    });
  }

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { authIdentities: true },
  });

  return withProvider(updatedUser);
}

export async function createSessionForUser({ userId, userAgent = '', ipAddress = '', expiresAt, deviceFingerprint, authContext }) {
  const sessionId = randomUUID();

  return prisma.session.create({
    data: {
      id: sessionId,
      userId: String(userId),
      userAgent: String(userAgent ?? ''),
      ipAddress: String(ipAddress ?? ''),
      deviceFingerprint: deviceFingerprint ? String(deviceFingerprint) : null,
      authContext: authContext ?? null,
      expiresAt: expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 8),
    },
  });
}

export async function findSessionById(sessionId) {
  if (!sessionId) {
    return null;
  }

  return prisma.session.findUnique({
    where: { id: String(sessionId) },
    include: { user: { include: { authIdentities: true } } },
  });
}

export async function findActiveSessionById(sessionId) {
  const session = await findSessionById(sessionId);

  if (!session) {
    return null;
  }

  if (session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  return session;
}

export async function revokeSession(sessionId) {
  if (!sessionId) {
    return false;
  }

  const result = await prisma.session.updateMany({
    where: {
      id: String(sessionId),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count > 0;
}

export async function revokeAllSessionsForUser(userId) {
  if (!userId) {
    return false;
  }

  const result = await prisma.session.updateMany({
    where: {
      userId: String(userId),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count > 0;
}
