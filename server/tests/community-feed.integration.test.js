import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { prisma } from '../src/config/db.js';
import app from '../src/app.js';
import { createPhase3FixtureSet } from './fixtures/phase3-fixtures.js';
import { createUniversityReview } from '../src/services/universityRatingService.js';

async function startServer() {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    server,
    url: `http://127.0.0.1:${port}`,
  };
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('community feed HTTP route returns a public empty feed without sensitive fields', async () => {
  const slug = `feed-test-${Date.now()}`;
  const university = await prisma.university.create({
    data: {
      name: 'Feed Integration Test University',
      slug,
      description: 'Isolated feed route test record',
    },
  });
  const { server, url } = await startServer();

  try {
    const response = await fetch(`${url}/api/universities/${slug}/feed`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      ok: true,
      university: {
        id: university.id,
        name: university.name,
        slug: university.slug,
        description: university.description,
      },
      items: [],
    });
    assert.equal(body.university.email, undefined);
    assert.equal(body.university.role, undefined);
    assert.equal(body.university.verificationStatus, undefined);
    assert.equal(body.university.supabaseUserId, undefined);
    assert.equal(body.university.memberships, undefined);
  } finally {
    await stopServer(server);
    await prisma.university.delete({ where: { id: university.id } });
  }
});

test('community feed HTTP route preserves public access for an invalid bearer token', async () => {
  const slug = `feed-token-test-${Date.now()}`;
  const university = await prisma.university.create({
    data: {
      name: 'Invalid Token Feed Test University',
      slug,
      description: null,
    },
  });
  const { server, url } = await startServer();

  try {
    const response = await fetch(`${url}/api/universities/${slug}/feed`, {
      headers: {
        Authorization: 'Bearer invalid-test-token',
        Origin: 'http://localhost:3000',
      },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.university.slug, slug);
    assert.deepEqual(body.items, []);
  } finally {
    await stopServer(server);
    await prisma.university.delete({ where: { id: university.id } });
  }
});

test('community feed HTTP route includes public review activity', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'feed-review' });
  const { server, url } = await startServer();
  try {
    await createUniversityReview({
      universitySlug: fixture.university.slug,
      userId: fixture.user.id,
      text: 'Public feed review',
      ratings: { academics: 5, facilities: 4, campus_life: 4, value: 5 },
    });

    const response = await fetch(`${url}/api/universities/${fixture.university.slug}/feed`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.items[0].type, 'review');
    assert.equal(body.items[0].text, 'Public feed review');
    assert.equal(body.items[0].author.email, undefined);
  } finally {
    await stopServer(server);
    await fixture.cleanup();
  }
});

test('community feed HTTP route rejects invalid slugs and unknown universities safely', async () => {
  const { server, url } = await startServer();

  try {
    const invalidSlugResponse = await fetch(`${url}/api/universities/x/feed`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(invalidSlugResponse.status, 400);
    assert.deepEqual(await invalidSlugResponse.json(), {
      ok: false,
      message: 'University slug must be a valid URL-safe identifier.',
    });

    const unknownUniversityResponse = await fetch(
      `${url}/api/universities/missing-feed-university-${Date.now()}/feed`,
      { headers: { Origin: 'http://localhost:3000' } },
    );
    assert.equal(unknownUniversityResponse.status, 404);
    assert.deepEqual(await unknownUniversityResponse.json(), {
      ok: false,
      message: 'University not found.',
    });
  } finally {
    await stopServer(server);
  }
});
