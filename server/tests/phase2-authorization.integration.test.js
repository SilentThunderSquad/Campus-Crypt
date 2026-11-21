import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { prisma } from '../src/config/db.js';
import app from '../src/app.js';
import { requireAuth, requireVerifiedUser, requireAdmin } from '../src/middleware/auth.js';
import { requireUniversityMember } from '../src/middleware/phase2Authorization.js';
import { syncUserFromSupabaseIdentity } from '../src/services/authService.js';
import { createUserProfile } from '../src/services/profileService.js';
import { getUniversityMembershipStatus } from '../src/services/communityMembershipService.js';

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

async function startServer() {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, url: `http://127.0.0.1:${port}` };
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('Task 2.6 public Phase 2 routes remain accessible to guests', async () => {
  const slug = `phase2-public-${Date.now()}`;
  const email = `phase2-public.${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-phase2-public-${Date.now()}`;
  const username = `phase2public${Date.now()}`;

  const university = await prisma.university.create({
    data: {
      name: 'Phase 2 Public Authorization Test',
      slug,
      description: 'Isolated public-route test',
    },
  });

  const user = await syncUserFromSupabaseIdentity({
    id: supabaseUserId,
    email,
    user_metadata: { full_name: 'Phase 2 Public Profile' },
  });
  await createUserProfile({
    userId: user.id,
    username,
    displayName: 'Phase 2 Public Profile',
  });

  const { server, url } = await startServer();

  try {
    const universityList = await fetch(`${url}/api/universities`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(universityList.status, 200);

    const universityDetail = await fetch(`${url}/api/universities/${slug}`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(universityDetail.status, 200);

    const membershipStatus = await fetch(`${url}/api/universities/${slug}/membership-status`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(membershipStatus.status, 200);
    const membershipBody = await membershipStatus.json();
    assert.equal(membershipBody.membershipStatus.isAuthenticated, false);
    assert.equal(membershipBody.membershipStatus.isMember, false);

    const profile = await fetch(`${url}/api/users/${username}`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(profile.status, 200);
    const profileBody = await profile.json();
    assert.equal(profileBody.profile.username, username);

    const feed = await fetch(`${url}/api/universities/${slug}/feed`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(feed.status, 200);
    const feedBody = await feed.json();
    assert.equal(feedBody.ok, true);
    assert.deepEqual(feedBody.items, []);

    const missingProfile = await fetch(`${url}/api/users/missing-profile-${Date.now().toString().slice(-6)}`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(missingProfile.status, 404);

    const missingUniversity = await fetch(
      `${url}/api/universities/missing-phase2-university-${Date.now()}`,
      { headers: { Origin: 'http://localhost:3000' } },
    );
    assert.equal(missingUniversity.status, 404);

    const missingMembership = await fetch(
      `${url}/api/universities/missing-phase2-university-${Date.now()}/membership-status`,
      { headers: { Origin: 'http://localhost:3000' } },
    );
    assert.equal(missingMembership.status, 404);
  } finally {
    await stopServer(server);
    await prisma.userProfile.deleteMany({ where: { username } });
    await prisma.communityMembership.deleteMany({ where: { universityId: university.id } });
    await prisma.university.deleteMany({ where: { id: university.id } });
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('Task 2.6 guest access is rejected from protected operations', async () => {
  const { server, url } = await startServer();

  try {
    const protectedResponse = await fetch(`${url}/api/auth/protected`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(protectedResponse.status, 401);

    const verifiedResponse = await fetch(`${url}/api/auth/verified-only`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(verifiedResponse.status, 401);

    const adminResponse = await fetch(`${url}/api/auth/admin-only`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(adminResponse.status, 401);

    const joinResponse = await fetch(`${url}/api/universities/unknown-university/join`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ userId: 'guessed-user-id', isMember: true }),
    });
    assert.equal(joinResponse.status, 401);

    const leaveResponse = await fetch(`${url}/api/universities/unknown-university/leave`, {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(leaveResponse.status, 401);

    const invalidJoinResponse = await fetch(`${url}/api/universities/x/join`, {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(invalidJoinResponse.status, 400);
  } finally {
    await stopServer(server);
  }
});

test('Task 2.6 database-backed verified and admin middleware decisions are enforced', async () => {
  const email = `phase2-authz.${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-phase2-authz-${Date.now()}`;

  try {
    const user = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: {
        full_name: 'Phase 2 Authorization Tester',
        role: 'admin',
        verificationStatus: 'verified',
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'student', verificationStatus: 'unverified' },
    });

    const unverifiedRes = createResponse();
    await requireVerifiedUser({ user }, unverifiedRes, () => {
      throw new Error('unverified user passed verified guard');
    });
    assert.equal(unverifiedRes.statusCode, 403);

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'student', verificationStatus: 'verified' },
    });

    const verifiedUser = await prisma.user.findUnique({ where: { id: user.id } });
    const verifiedRes = createResponse();
    let verifiedPassed = false;
    await requireVerifiedUser({ user: verifiedUser }, verifiedRes, () => {
      verifiedPassed = true;
    });
    assert.equal(verifiedPassed, true);

    const nonAdminRes = createResponse();
    await requireAdmin({ user: verifiedUser }, nonAdminRes, () => {
      throw new Error('student passed admin guard');
    });
    assert.equal(nonAdminRes.statusCode, 403);

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin', verificationStatus: 'verified' },
    });

    const adminUser = await prisma.user.findUnique({ where: { id: user.id } });
    const adminRes = createResponse();
    let adminPassed = false;
    await requireAdmin({ user: adminUser }, adminRes, () => {
      adminPassed = true;
    });
    assert.equal(adminPassed, true);

    const authRes = createResponse();
    let authPassed = false;
    await requireAuth({ user: adminUser, headers: {}, cookies: {} }, authRes, () => {
      authPassed = true;
    });
    assert.equal(authPassed, true);
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});

test('Task 2.6 membership authorization uses database membership and rejects ID guessing', async () => {
  const slug = `phase2-member-${Date.now()}`;
  const email = `phase2-member.${Date.now()}@campuscrypt.dev`;
  const supabaseUserId = `supabase-phase2-member-${Date.now()}`;

  const university = await prisma.university.create({
    data: {
      name: 'Phase 2 Membership Authorization Test',
      slug,
      description: 'Isolated membership authorization test',
    },
  });

  try {
    const user = await syncUserFromSupabaseIdentity({
      id: supabaseUserId,
      email,
      user_metadata: { full_name: 'Phase 2 Member Tester' },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationStatus: 'verified' },
    });
    const verifiedUser = await prisma.user.findUnique({ where: { id: user.id } });

    const noMembershipRes = createResponse();
    await requireUniversityMember(
      { user: verifiedUser, params: { slug } },
      noMembershipRes,
      () => {
        throw new Error('verified non-member passed membership guard');
      },
    );
    assert.equal(noMembershipRes.statusCode, 403);

    await prisma.communityMembership.create({
      data: {
        userId: verifiedUser.id,
        universityId: university.id,
      },
    });

    const memberRes = createResponse();
    let memberPassed = false;
    await requireUniversityMember(
      { user: verifiedUser, params: { slug } },
      memberRes,
      () => {
        memberPassed = true;
      },
    );
    assert.equal(memberPassed, true);

    const status = await getUniversityMembershipStatus({
      user: verifiedUser,
      universitySlug: slug,
    });
    assert.equal(status.isMember, true);
    assert.equal(status.canJoin, false);
    assert.equal(status.canLeave, true);

    const unknownStatus = await getUniversityMembershipStatus({
      user: verifiedUser,
      universitySlug: `missing-phase2-${Date.now()}`,
    });
    assert.equal(unknownStatus.university, null);
  } finally {
    await prisma.communityMembership.deleteMany({ where: { universityId: university.id } });
    await prisma.university.deleteMany({ where: { id: university.id } });
    await prisma.user.deleteMany({ where: { email } });
  }
});
