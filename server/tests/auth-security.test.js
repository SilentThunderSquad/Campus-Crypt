import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { prisma } from '../src/config/db.js';
import app from '../src/app.js';
import { requireAdmin, requireAuth, requireVerifiedUser } from '../src/middleware/auth.js';
import {
  resolveSupabaseAccessTokenFromRequest,
  revokeSessionForRequest,
  syncUserFromSupabaseIdentity,
} from '../src/services/authService.js';
import {
  findUniversityBySlug,
  normalizeUniversitySlug,
} from '../src/services/universityService.js';
import {
  getUniversityMembershipStatus,
  joinUniversity,
  leaveUniversity,
} from '../src/services/communityMembershipService.js';
import {
  getUserProfileByUsername,
  getUserProfileByUserId,
  createUserProfile,
} from '../src/services/profileService.js';
import { canReadPublicCommunityFeed } from '../src/services/communityFeedService.js';
import {
  isValidUsername,
  normalizeUsername,
  isReservedUsername,
} from '../src/validators/profileValidators.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('unauthenticated request is rejected from a protected endpoint', async () => {
  const req = { headers: {}, cookies: {} };
  const res = createResponse();

  await requireAuth(req, res, () => {
    throw new Error('next should not be called for unauthenticated requests');
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.ok, false);
});

test('authenticated Supabase identity is accepted by the backend guard', async () => {
  const req = {
    user: {
      id: 'user-123',
      email: 'student@campuscrypt.dev',
      role: 'student',
      verificationStatus: 'unverified',
      provider: 'google',
    },
    headers: {},
    cookies: {},
  };
  const res = createResponse();
  let nextCalled = false;

  await requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('database-backed role controls authorization decisions', async () => {
  const res = createResponse();
  const adminReq = {
    user: { role: 'admin', verificationStatus: 'verified' },
  };
  const studentReq = {
    user: { role: 'student', verificationStatus: 'verified' },
  };

  let nextCalled = false;
  await requireAdmin(adminReq, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);

  const restricted = createResponse();
  await requireAdmin(studentReq, restricted, () => {
    throw new Error('student should not pass admin guard');
  });
  assert.equal(restricted.statusCode, 403);
});

test('database-backed verification status controls authorization decisions', async () => {
  const verified = { user: { verificationStatus: 'verified' } };
  const unverified = { user: { verificationStatus: 'unverified' } };
  const verifiedRes = createResponse();
  const unverifiedRes = createResponse();

  let nextCalled = false;
  await requireVerifiedUser(verified, verifiedRes, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);

  await requireVerifiedUser(unverified, unverifiedRes, () => {
    throw new Error('unverified user should not pass verified guard');
  });
  assert.equal(unverifiedRes.statusCode, 403);
});

test('stale JWT role or verification metadata cannot bypass authorization', async () => {
  const res = createResponse();
  const req = {
    user: {
      role: 'student',
      verificationStatus: 'unverified',
      staleMetadata: { role: 'admin', verificationStatus: 'verified' },
    },
  };

  await requireAdmin(req, res, () => {
    throw new Error('stale metadata must not grant privilege');
  });

  assert.equal(res.statusCode, 403);

  const verifiedRes = createResponse();
  await requireVerifiedUser(req, verifiedRes, () => {
    throw new Error('stale metadata must not grant verified access');
  });
  assert.equal(verifiedRes.statusCode, 403);
});

test('Supabase MFA and passkey readiness metadata remains informational and does not change authorization', async () => {
  const email = `mfa.${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-mfa-${Date.now()}`;

  try {
    const user = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: {
        full_name: 'MFA Readiness Tester',
        amr: ['pwd', 'totp'],
        factors: ['webauthn'],
        mfa_enabled: true,
        has_passkey: true,
        role: 'admin',
        verificationStatus: 'verified',
      },
    });

    assert.equal(user.role, 'student');
    assert.equal(user.verificationStatus, 'unverified');
    assert.equal(user.authMetadata.campusCryptSecurity.mfa.enabled, true);
    assert.equal(user.authMetadata.campusCryptSecurity.passkey.ready, true);

    const protectedReq = {
      user: {
        role: 'student',
        verificationStatus: 'unverified',
        authContext: {
          mfa: { enabled: true },
          passkey: { ready: true },
          role: 'admin',
          verificationStatus: 'verified',
        },
      },
    };

    const adminRes = createResponse();
    await requireAdmin(protectedReq, adminRes, () => {
      throw new Error('MFA/passkey readiness metadata must not grant administrator access');
    });
    assert.equal(adminRes.statusCode, 403);

    const verifiedRes = createResponse();
    await requireVerifiedUser(protectedReq, verifiedRes, () => {
      throw new Error('MFA/passkey readiness metadata must not grant verified access');
    });
    assert.equal(verifiedRes.statusCode, 403);
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('security headers, CORS policy, and request validation are enforced', async () => {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const blockedOrigin = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: { Origin: 'https://evil.example' },
    });
    assert.equal(blockedOrigin.headers.get('access-control-allow-origin'), null);

    const allowedOrigin = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(allowedOrigin.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(allowedOrigin.headers.get('x-frame-options'), 'DENY');
    assert.equal(allowedOrigin.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(allowedOrigin.headers.get('ratelimit-limit'));

    const malformedJson = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Origin: 'http://localhost:3000' },
      body: '{',
    });
    assert.equal(malformedJson.status, 400);
    const malformedBody = await malformedJson.json();
    assert.equal(malformedBody.ok, false);
    assert.equal(malformedBody.message, 'Malformed JSON request body.');
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test('Supabase bearer token is extracted from the request', () => {
  const token = resolveSupabaseAccessTokenFromRequest({
    headers: { authorization: 'Bearer access-token-123' },
    cookies: {},
  });

  assert.equal(token, 'access-token-123');
});

test('logout is safe when there is no active Supabase token', async () => {
  const result = await revokeSessionForRequest({
    headers: {},
    cookies: {},
  });

  assert.equal(result, false);
});

test('authenticated Supabase user maps to a single Campus Crypt user record', async () => {
  const email = `lifecycle.${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-user-${Date.now()}`;

  try {
    const first = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: { full_name: 'Lifecycle Tester' },
    });
    const second = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: { full_name: 'Lifecycle Tester' },
    });

    assert.ok(first);
    assert.equal(first.id, second.id);

    const userCount = await prisma.user.count({
      where: {
        OR: [{ id: first.id }, { email }],
      },
    });

    assert.equal(userCount, 1);
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('database-backed role and verification changes alter authorization behavior', async () => {
  const email = `authz.${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-authz-${Date.now()}`;

  try {
    const syncedUser = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: { full_name: 'Authorization Tester' },
    });

    await prisma.user.update({
      where: { id: syncedUser.id },
      data: { role: 'student', verificationStatus: 'unverified' },
    });

    const unverified = {
      user: {
        id: syncedUser.id,
        email,
        role: 'student',
        verificationStatus: 'unverified',
      },
    };

    const unverifiedRes = createResponse();
    await requireVerifiedUser(unverified, unverifiedRes, () => {
      throw new Error('unverified user should not satisfy verified guard');
    });
    assert.equal(unverifiedRes.statusCode, 403);

    await prisma.user.update({
      where: { id: syncedUser.id },
      data: { role: 'admin', verificationStatus: 'verified' },
    });

    const adminReq = {
      user: {
        id: syncedUser.id,
        email,
        role: 'admin',
        verificationStatus: 'verified',
      },
    };
    const adminRes = createResponse();
    let adminNextCalled = false;
    await requireAdmin(adminReq, adminRes, () => {
      adminNextCalled = true;
    });
    assert.equal(adminNextCalled, true);
    assert.equal(adminRes.statusCode, 200);
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('university slugs are URL-safe and public university endpoints resolve by slug', async () => {
  const slug = `harvard-${Date.now()}`;
  const universityName = `Harvard University ${Date.now()}`;

  try {
    assert.equal(normalizeUniversitySlug('Harvard University!'), 'harvard-university');

    await prisma.university.create({
      data: {
        name: universityName,
        slug,
        description: 'Public university profile',
      },
    });

    const server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    try {
      const listResponse = await fetch(`http://127.0.0.1:${port}/api/universities`, {
        headers: { Origin: 'http://localhost:3000' },
      });
      assert.equal(listResponse.status, 200);
      const listBody = await listResponse.json();
      assert.equal(listBody.ok, true);
      assert.ok(listBody.universities.some((item) => item.slug === slug));

      const detailResponse = await fetch(`http://127.0.0.1:${port}/api/universities/${encodeURIComponent(slug)}`, {
        headers: { Origin: 'http://localhost:3000' },
      });
      assert.equal(detailResponse.status, 200);
      const detailBody = await detailResponse.json();
      assert.equal(detailBody.ok, true);
      assert.equal(detailBody.university.slug, slug);
      assert.equal(detailBody.university.memberCount, 0);

      const missingResponse = await fetch(`http://127.0.0.1:${port}/api/universities/missing-university-${Date.now()}`, {
        headers: { Origin: 'http://localhost:3000' },
      });
      assert.equal(missingResponse.status, 404);
      const missingBody = await missingResponse.json();
      assert.equal(missingBody.ok, false);
      assert.equal(missingBody.message, 'University not found.');
    } finally {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }

    const duplicateCheck = prisma.university.create({
      data: {
        name: 'Duplicate university',
        slug,
        description: 'Should fail',
      },
    });
    await assert.rejects(duplicateCheck, /Unique constraint failed|duplicate key/i);
  } finally {
    await prisma.university.deleteMany({ where: { slug } });
    const databaseLookup = await findUniversityBySlug(slug);
    assert.equal(databaseLookup, null);
  }
});

test('valid usernames are accepted and invalid usernames are rejected', () => {
  assert.equal(isValidUsername('alice'), true);
  assert.equal(isValidUsername('bob_123'), true);
  assert.equal(isValidUsername('charlie-smith'), true);
  assert.equal(isValidUsername('alice123'), true);

  assert.equal(isValidUsername('ab'), false);
  assert.equal(isValidUsername('a_'.repeat(20)), false);
  assert.equal(isValidUsername('alice@bob'), false);
  assert.equal(isValidUsername('alice bob'), false);
  assert.equal(isValidUsername('-alice'), false);
  assert.equal(isValidUsername('alice-'), false);
  assert.equal(isValidUsername('_alice'), false);
  assert.equal(isValidUsername('alice_'), false);
  assert.equal(isValidUsername(''), false);
  assert.equal(isValidUsername(null), false);
  assert.equal(isValidUsername(undefined), false);
});

test('reserved usernames are rejected', () => {
  assert.equal(isReservedUsername('admin'), true);
  assert.equal(isReservedUsername('api'), true);
  assert.equal(isReservedUsername('profile'), true);
  assert.equal(isReservedUsername('settings'), true);
  assert.equal(isReservedUsername('Admin'), true);
  assert.equal(isReservedUsername('ADMIN'), true);

  assert.equal(isReservedUsername('alice'), false);
  assert.equal(isReservedUsername('bob_smith'), false);
  assert.equal(isReservedUsername('charlie123'), false);
});

test('username normalization converts to lowercase', () => {
  assert.equal(normalizeUsername('Alice'), 'alice');
  assert.equal(normalizeUsername('BOB_123'), 'bob_123');
  assert.equal(normalizeUsername('  charlie-smith  '), 'charlie-smith');
  assert.equal(normalizeUsername(''), null);
  assert.equal(normalizeUsername(null), null);
});

test('public community feed read policy allows every supported user state', () => {
  const states = [
    null,
    { id: 'unverified-user', role: 'student', verificationStatus: 'unverified' },
    { id: 'verified-non-member', role: 'student', verificationStatus: 'verified' },
    { id: 'verified-member', role: 'student', verificationStatus: 'verified' },
    { id: 'administrator', role: 'admin', verificationStatus: 'verified' },
  ];

  for (const user of states) {
    assert.equal(canReadPublicCommunityFeed({ user }), true);
  }
});

test('user profile can be created with valid username and retrieved by username', async () => {
  const email = `profile.${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-profile-${Date.now()}`;
  const username = `testuser${Date.now()}`;

  try {
    const user = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: { full_name: 'Test Profile User' },
    });

    const profile = await createUserProfile({
      userId: user.id,
      username,
      displayName: 'Test Profile User',
      bio: 'A test profile',
      avatarUrl: null,
    });

    assert.equal(profile.username, username);
    assert.equal(profile.userId, user.id);
    assert.equal(profile.displayName, 'Test Profile User');
    assert.equal(profile.bio, 'A test profile');

    const retrieved = await getUserProfileByUsername(username);
    assert.ok(retrieved);
    assert.equal(retrieved.username, username);
    assert.equal(retrieved.userId, user.id);
    assert.equal(retrieved.displayName, 'Test Profile User');

    const retrievedById = await getUserProfileByUserId(user.id);
    assert.ok(retrievedById);
    assert.equal(retrievedById.username, username);
    assert.equal(retrievedById.userId, user.id);
  } finally {
    await prisma.userProfile.deleteMany({ where: { username } });
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('duplicate usernames are rejected at database level', async () => {
  const email1 = `profile-dup-1-${Date.now()}@campuscrypt.dev`;
  const email2 = `profile-dup-2-${Date.now()}@campuscrypt.dev`;
  const supabaseUserId1 = `supabase-profile-dup-1-${Date.now()}`;
  const supabaseUserId2 = `supabase-profile-dup-2-${Date.now()}`;
  const username = `duptest${Date.now()}`;

  try {
    const user1 = await syncUserFromSupabaseIdentity({
      id: supabaseUserId1,
      email: email1,
      user_metadata: { full_name: 'User 1' },
    });

    const user2 = await syncUserFromSupabaseIdentity({
      id: supabaseUserId2,
      email: email2,
      user_metadata: { full_name: 'User 2' },
    });

    const profile1 = await createUserProfile({
      userId: user1.id,
      username,
      displayName: 'User 1',
    });

    assert.ok(profile1);

    const profile2Promise = createUserProfile({
      userId: user2.id,
      username,
      displayName: 'User 2',
    });

    await assert.rejects(profile2Promise, /already taken|duplicate/i);
  } finally {
    await prisma.userProfile.deleteMany({ where: { username } });
    await prisma.user.deleteMany({ where: { email: { in: [email1, email2] } } });
  }
});

test('profile lookup returns not found for missing username', async () => {
  const missing = `missing-profile-${Date.now()}`;
  const profile = await getUserProfileByUsername(missing);
  assert.equal(profile, null);
});

test('profile lookup does not expose sensitive user fields', async () => {
  const email = `sensitive-${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-sensitive-${Date.now()}`;
  const username = `sensitive${Date.now()}`;

  try {
    const user = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: { full_name: 'Sensitive User' },
    });

    await createUserProfile({
      userId: user.id,
      username,
      displayName: 'Sensitive User',
    });

    const profile = await getUserProfileByUsername(username);

    assert.ok(profile);
    assert.ok(profile.user);
    assert.equal(profile.user.id, user.id);
    assert.equal(profile.user.name, user.name);
    assert.ok(profile.user.createdAt);

    assert.equal(profile.user.email, undefined);
    assert.equal(profile.user.role, undefined);
    assert.equal(profile.user.verificationStatus, undefined);
    assert.equal(profile.user.supabaseUserId, undefined);
    assert.equal(profile.user.authMetadata, undefined);
    assert.equal(profile.user.lastLoginAt, undefined);
    assert.equal(profile.user.lastLoginIp, undefined);
  } finally {
    await prisma.userProfile.deleteMany({ where: { username } });
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('public profile endpoint resolves by username and hides sensitive fields', async () => {
  const email = `endpoint-${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-endpoint-${Date.now()}`;
  const username = `endpointuser${Date.now()}`;

  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const user = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: { full_name: 'Endpoint Test User' },
    });

    await createUserProfile({
      userId: user.id,
      username,
      displayName: 'Endpoint Test User',
      bio: 'A public profile',
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/users/${encodeURIComponent(username)}`, {
      headers: { Origin: 'http://localhost:3000' },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.ok(body.profile);
    assert.equal(body.profile.username, username);
    assert.equal(body.profile.displayName, 'Endpoint Test User');

    const missingResponse = await fetch(`http://127.0.0.1:${port}/api/users/missing-profile-${Date.now()}`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(missingResponse.status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await prisma.userProfile.deleteMany({ where: { username } });
    await prisma.user.deleteMany({ where: { email } });
  }
});

