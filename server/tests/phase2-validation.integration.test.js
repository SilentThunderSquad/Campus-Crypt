import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { prisma } from '../src/config/db.js';
import app from '../src/app.js';
import {
  normalizeUniversitySlug,
  isValidUniversitySlug,
  createUniversity,
} from '../src/services/universityService.js';
import {
  normalizeUsername,
  isValidUsername,
  isReservedUsername,
} from '../src/validators/profileValidators.js';
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

test('Task 2.7 university slugs normalize and reject malformed values', async () => {
  assert.equal(normalizeUniversitySlug('  Harvard University!  '), 'harvard-university');
  assert.equal(isValidUniversitySlug('harvard-university'), true);
  assert.equal(isValidUniversitySlug('x'), false);
  assert.equal(isValidUniversitySlug('harvard university'), true);
  assert.equal(isValidUniversitySlug('!!!'), false);

  const slug = `phase2-valid-${Date.now()}`;
  const normalized = normalizeUniversitySlug(`  ${slug.toUpperCase()}!  `);
  assert.equal(normalized, slug);
});

test('Task 2.7 duplicate university slugs are rejected safely', async () => {
  const slug = `phase2-duplicate-${Date.now()}`;
  const university = await createUniversity({
    name: 'Phase 2 Duplicate University',
    slug,
    description: 'Isolated duplicate slug test',
  });

  try {
    await assert.rejects(
      createUniversity({
        name: 'Phase 2 Duplicate University 2',
        slug: slug.toUpperCase(),
        description: 'Duplicate attempt',
      }),
      /already taken|P2002|duplicate|unique/i,
    );
  } finally {
    await prisma.university.deleteMany({ where: { id: university.id } });
  }
});

test('Task 2.7 usernames normalize, validate, and reject reserved names', () => {
  assert.equal(normalizeUsername('  Alice_SMITH  '), 'alice_smith');
  assert.equal(isValidUsername('Alice_SMITH'), true);
  assert.equal(isValidUsername('ab'), false);
  assert.equal(isValidUsername('alice@smith'), false);
  assert.equal(isValidUsername('-alice'), false);
  assert.equal(isValidUsername('alice_'), false);

  assert.equal(isReservedUsername('Admin'), true);
  assert.equal(isReservedUsername('profile'), true);
  assert.equal(isReservedUsername('phase2-valid-user'), false);
});

test('Task 2.7 duplicate usernames are rejected safely and cleaned up', async () => {
  const suffix = Date.now();
  const email1 = `phase2-validation-1.${suffix}@campuscrypt.dev`;
  const email2 = `phase2-validation-2.${suffix}@campuscrypt.dev`;
  const username = `validation${suffix}`;

  try {
    const user1 = await syncUserFromSupabaseIdentity({
      id: `supabase-phase2-validation-1-${suffix}`,
      email: email1,
      user_metadata: { full_name: 'Validation User 1' },
    });
    const user2 = await syncUserFromSupabaseIdentity({
      id: `supabase-phase2-validation-2-${suffix}`,
      email: email2,
      user_metadata: { full_name: 'Validation User 2' },
    });

    await createUserProfile({
      userId: user1.id,
      username,
      displayName: 'Validation User 1',
    });

    await assert.rejects(
      createUserProfile({
        userId: user2.id,
        username: username.toUpperCase(),
        displayName: 'Validation User 2',
      }),
      /already taken|P2002|duplicate|unique/i,
    );
  } finally {
    await prisma.userProfile.deleteMany({ where: { username } });
    await prisma.user.deleteMany({
      where: { email: { in: [email1, email2] } },
    });
  }
});

test('Task 2.7 public routes reject malformed and reserved identifiers safely', async () => {
  const slug = `phase2-route-${Date.now()}`;
  const university = await createUniversity({
    name: 'Phase 2 Route Validation University',
    slug,
    description: 'Isolated route validation test',
  });
  const { server, url } = await startServer();

  try {
    const universityInvalid = await fetch(`${url}/api/universities/x`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(universityInvalid.status, 400);

    const membershipInvalid = await fetch(`${url}/api/universities/x/membership-status`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(membershipInvalid.status, 400);

    const feedInvalid = await fetch(`${url}/api/universities/x/feed`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(feedInvalid.status, 400);

    const reservedProfile = await fetch(`${url}/api/users/admin`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(reservedProfile.status, 400);

    const missingUniversity = await fetch(
      `${url}/api/universities/missing-phase2-${Date.now()}`,
      { headers: { Origin: 'http://localhost:3000' } },
    );
    assert.equal(missingUniversity.status, 404);

    const validUniversity = await fetch(`${url}/api/universities/${slug}`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(validUniversity.status, 200);
  } finally {
    await stopServer(server);
    await prisma.communityMembership.deleteMany({ where: { universityId: university.id } });
    await prisma.university.deleteMany({ where: { id: university.id } });
  }
});
