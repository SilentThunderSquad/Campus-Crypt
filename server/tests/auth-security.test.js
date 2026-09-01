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
