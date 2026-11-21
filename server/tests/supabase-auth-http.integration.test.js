import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../src/config/db.js';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

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

async function createSupabaseTestSession({ email, password, userMetadata = {} }) {
  const admin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (error || !data?.user) {
    throw new Error('Unable to create isolated Supabase test user.');
  }

  const anon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await anon.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data?.session?.access_token) {
    await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
    throw new Error('Unable to establish isolated Supabase test session.');
  }

  return {
    admin,
    supabaseUserId: data.user.id,
    accessToken: signIn.data.session.access_token,
  };
}

test('Task 2.8 genuine Supabase HTTP-token authorization matrix', { skip: !env.supabaseUrl || !env.supabaseAnonKey || !env.supabaseServiceRoleKey }, async () => {
  const suffix = randomUUID();
  const universitySlug = `task28-auth-${suffix.slice(0, 8)}`;
  const fixtures = [];
  let university = null;
  let server = null;
  let url = null;

  try {
    university = await prisma.university.create({
      data: {
        name: 'Task 2.8 Supabase Authorization University',
        slug: universitySlug,
        description: 'Isolated genuine Supabase authorization test',
      },
    });

    const started = await startServer();
    server = started.server;
    url = started.url;

    const createFixture = async (label, userMetadata = {}) => {
      const password = randomUUID();
      const email = `task28-${label}.${suffix}@campuscrypt.dev`;
      const session = await createSupabaseTestSession({ email, password, userMetadata });
      fixtures.push({ ...session, email });
      return session;
    };

    const unverified = await createFixture('unverified');
    const unverifiedSession = await fetch(`${url}/api/auth/session`, {
      headers: { Authorization: `Bearer ${unverified.accessToken}` },
    });
    assert.equal(unverifiedSession.status, 200);
    const unverifiedBody = await unverifiedSession.json();
    assert.equal(unverifiedBody.authenticated, true);
    assert.equal(unverifiedBody.user.verificationStatus, 'unverified');

    const unverifiedVerifiedOnly = await fetch(`${url}/api/auth/verified-only`, {
      headers: { Authorization: `Bearer ${unverified.accessToken}` },
    });
    assert.equal(unverifiedVerifiedOnly.status, 403);

    const nonMember = await createFixture('verified-non-member');
    const nonMemberSession = await fetch(`${url}/api/auth/session`, {
      headers: { Authorization: `Bearer ${nonMember.accessToken}` },
    });
    assert.equal(nonMemberSession.status, 200);
    const nonMemberBody = await nonMemberSession.json();
    await prisma.user.update({
      where: { id: nonMemberBody.user.id },
      data: { verificationStatus: 'verified' },
    });

    const nonMemberVerifiedOnly = await fetch(`${url}/api/auth/verified-only`, {
      headers: { Authorization: `Bearer ${nonMember.accessToken}` },
    });
    assert.equal(nonMemberVerifiedOnly.status, 200);

    const joinResponse = await fetch(`${url}/api/universities/${universitySlug}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nonMember.accessToken}`,
        Origin: 'http://localhost:3000',
      },
    });
    assert.equal(joinResponse.status, 201);

    const memberStatus = await fetch(`${url}/api/universities/${universitySlug}/membership-status`, {
      headers: { Authorization: `Bearer ${nonMember.accessToken}` },
    });
    assert.equal(memberStatus.status, 200);
    const memberStatusBody = await memberStatus.json();
    assert.equal(memberStatusBody.membershipStatus.isAuthenticated, true);
    assert.equal(memberStatusBody.membershipStatus.isMember, true);
    assert.equal(memberStatusBody.membershipStatus.canLeave, true);

    const leaveResponse = await fetch(`${url}/api/universities/${universitySlug}/leave`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nonMember.accessToken}`,
        Origin: 'http://localhost:3000',
      },
    });
    assert.equal(leaveResponse.status, 200);

    const memberFixture = await createFixture('verified-member');
    const memberSession = await fetch(`${url}/api/auth/session`, {
      headers: { Authorization: `Bearer ${memberFixture.accessToken}` },
    });
    const memberBody = await memberSession.json();
    await prisma.user.update({
      where: { id: memberBody.user.id },
      data: { verificationStatus: 'verified' },
    });
    await prisma.communityMembership.create({
      data: {
        userId: memberBody.user.id,
        universityId: university.id,
      },
    });
    const memberFeed = await fetch(`${url}/api/universities/${universitySlug}/feed`, {
      headers: { Authorization: `Bearer ${memberFixture.accessToken}` },
    });
    assert.equal(memberFeed.status, 200);

    const adminFixture = await createFixture('admin');
    const adminSession = await fetch(`${url}/api/auth/session`, {
      headers: { Authorization: `Bearer ${adminFixture.accessToken}` },
    });
    const adminBody = await adminSession.json();
    await prisma.user.update({
      where: { id: adminBody.user.id },
      data: { role: 'admin', verificationStatus: 'verified' },
    });
    const adminResponse = await fetch(`${url}/api/auth/admin-only`, {
      headers: { Authorization: `Bearer ${adminFixture.accessToken}` },
    });
    assert.equal(adminResponse.status, 200);

    const staleFixture = await createFixture('stale-claims', {
      role: 'admin',
      verificationStatus: 'verified',
    });
    const staleSession = await fetch(`${url}/api/auth/session`, {
      headers: { Authorization: `Bearer ${staleFixture.accessToken}` },
    });
    const staleBody = await staleSession.json();
    assert.equal(staleBody.user.role, 'student');
    assert.equal(staleBody.user.verificationStatus, 'unverified');
    const staleAdmin = await fetch(`${url}/api/auth/admin-only`, {
      headers: { Authorization: `Bearer ${staleFixture.accessToken}` },
    });
    assert.equal(staleAdmin.status, 403);
    const staleVerified = await fetch(`${url}/api/auth/verified-only`, {
      headers: { Authorization: `Bearer ${staleFixture.accessToken}` },
    });
    assert.equal(staleVerified.status, 403);
  } finally {
    if (server) {
      await stopServer(server);
    }
    if (university) {
      await prisma.communityMembership.deleteMany({ where: { universityId: university.id } });
      await prisma.university.deleteMany({ where: { id: university.id } });
    }
    if (fixtures.length > 0) {
      await prisma.user.deleteMany({
        where: {
          supabaseUserId: { in: fixtures.map((fixture) => fixture.supabaseUserId) },
        },
      });
      for (const fixture of fixtures) {
        await fixture.admin.auth.admin.deleteUser(fixture.supabaseUserId).catch(() => {});
      }
    }
  }
});
