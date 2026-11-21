import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { prisma } from '../src/config/db.js';
import app from '../src/app.js';
import { parseAppRoute } from '../../client/src/routes.js';
import { syncUserFromSupabaseIdentity } from '../src/services/authService.js';
import { createUserProfile } from '../src/services/profileService.js';

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

test('Task 2.8 pathname routing resolves university, profile, feed, and unknown routes', () => {
  assert.deepEqual(parseAppRoute('/u/harvard/feed'), { page: 'feed', slug: 'harvard' });
  assert.deepEqual(parseAppRoute('/u/harvard/feed/'), { page: 'feed', slug: 'harvard' });
  assert.deepEqual(parseAppRoute('/u/harvard'), { page: 'university', slug: 'harvard' });
  assert.deepEqual(parseAppRoute('/profile/alice-smith'), { page: 'profile', username: 'alice-smith' });
  assert.deepEqual(parseAppRoute('/unknown'), { page: 'home' });
});

test('Task 2.8 university and profile frontend APIs load, validate, and fail safely', async () => {
  const suffix = Date.now();
  const slug = `task28-university-${suffix}`;
  const email = `task28-profile.${suffix}@campuscrypt.dev`;
  const supabaseUserId = `supabase-task28-profile-${suffix}`;
  const username = `task28profile${suffix.toString().slice(-8)}`;

  const university = await prisma.university.create({
    data: {
      name: 'Task 2.8 Integration University',
      slug,
      description: 'Isolated Task 2.8 frontend integration record',
    },
  });
  const user = await syncUserFromSupabaseIdentity({
    id: supabaseUserId,
    email,
    user_metadata: { full_name: 'Task 2.8 Profile' },
  });
  await createUserProfile({
    userId: user.id,
    username,
    displayName: 'Task 2.8 Profile',
  });

  const { server, url } = await startServer();
  try {
    const universityResponse = await fetch(`${url}/api/universities/${slug}`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(universityResponse.status, 200);
    const universityBody = await universityResponse.json();
    assert.equal(universityBody.university.slug, slug);

    const membershipResponse = await fetch(`${url}/api/universities/${slug}/membership-status`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(membershipResponse.status, 200);
    const membershipBody = await membershipResponse.json();
    assert.equal(membershipBody.membershipStatus.isAuthenticated, false);

    const feedResponse = await fetch(`${url}/api/universities/${slug}/feed`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(feedResponse.status, 200);
    const feedBody = await feedResponse.json();
    assert.deepEqual(feedBody.items, []);

    const profileResponse = await fetch(`${url}/api/users/${username}`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(profileResponse.status, 200);
    const profileBody = await profileResponse.json();
    assert.equal(profileBody.profile.username, username);

    const invalidUniversity = await fetch(`${url}/api/universities/x`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(invalidUniversity.status, 400);

    const unknownUniversity = await fetch(
      `${url}/api/universities/missing-task28-${Date.now()}`,
      { headers: { Origin: 'http://localhost:3000' } },
    );
    assert.equal(unknownUniversity.status, 404);

    const reservedProfile = await fetch(`${url}/api/users/admin`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(reservedProfile.status, 400);

    const unknownProfile = await fetch(
      `${url}/api/users/missing-task28-${Date.now().toString().slice(-6)}`,
      { headers: { Origin: 'http://localhost:3000' } },
    );
    assert.equal(unknownProfile.status, 404);
  } finally {
    await stopServer(server);
    await prisma.userProfile.deleteMany({ where: { username } });
    await prisma.communityMembership.deleteMany({ where: { universityId: university.id } });
    await prisma.university.deleteMany({ where: { id: university.id } });
    await prisma.user.deleteMany({ where: { email } });
  }
});
