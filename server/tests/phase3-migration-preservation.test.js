import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/config/db.js';
import {
  createPhase3FixtureSet,
  createPhase3ReservedIds,
} from './fixtures/phase3-fixtures.js';

function assertPrismaUniqueViolation(error) {
  assert.equal(error?.code, 'P2002');
  return true;
}

async function readPostgresConstraint(tableName) {
  const rows = await prisma.$queryRaw`
    SELECT conname::text AS name,
           contype::text AS type,
           pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = to_regclass(${tableName})
  `;

  return rows;
}

async function readPostgresIndexes(tableName) {
  const rows = await prisma.$queryRaw`
    SELECT indexname::text AS name,
           indexdef::text AS definition
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = ${tableName}
  `;

  return rows;
}

test('Phase 3 migration preservation: PostgreSQL metadata proves the pre-migration baseline', async () => {
  const universityIndexes = await readPostgresIndexes('universities');
  const userIndexes = await readPostgresIndexes('users');
  const membershipIndexes = await readPostgresIndexes('community_memberships');
  const profileIndexes = await readPostgresIndexes('user_profiles');

  assert.ok(
    universityIndexes.some((row) => row.name === 'universities_slug_key' && row.definition.includes('UNIQUE')),
  );
  assert.ok(
    userIndexes.some((row) => row.name === 'users_email_key' && row.definition.includes('UNIQUE')),
  );
  assert.ok(
    userIndexes.some((row) => row.name === 'users_supabaseUserId_key' && row.definition.includes('UNIQUE')),
  );
  assert.ok(
    membershipIndexes.some(
      (row) =>
        row.name === 'community_memberships_userId_universityId_key'
        && row.definition.includes('UNIQUE'),
    ),
  );
  assert.ok(
    profileIndexes.some((row) => row.name === 'user_profiles_username_key' && row.definition.includes('UNIQUE')),
  );
  assert.ok(
    profileIndexes.some((row) => row.name === 'user_profiles_userId_key' && row.definition.includes('UNIQUE')),
  );

  const authConstraints = await readPostgresConstraint('auth_identities');
  const sessionConstraints = await readPostgresConstraint('sessions');
  const membershipConstraints = await readPostgresConstraint('community_memberships');
  const profileConstraints = await readPostgresConstraint('user_profiles');

  assert.ok(
    authConstraints.some(
      (row) => row.type === 'f' && row.definition.includes('REFERENCES users(id)') && row.definition.includes('ON DELETE CASCADE'),
    ),
  );
  assert.ok(
    sessionConstraints.some(
      (row) => row.type === 'f' && row.definition.includes('REFERENCES users(id)') && row.definition.includes('ON DELETE CASCADE'),
    ),
  );
  assert.ok(
    membershipConstraints.some((row) => row.type === 'f' && row.definition.includes('REFERENCES users(id)')),
  );
  assert.ok(
    membershipConstraints.some((row) => row.type === 'f' && row.definition.includes('REFERENCES universities(id)')),
  );
  assert.ok(
    profileConstraints.some(
      (row) => row.type === 'f' && row.definition.includes('REFERENCES users(id)') && row.definition.includes('ON DELETE CASCADE'),
    ),
  );

  const reservedIds = createPhase3ReservedIds();
  assert.match(reservedIds.postId, /^[0-9a-f-]{36}$/);
  assert.match(reservedIds.commentId, /^[0-9a-f-]{36}$/);
  assert.match(reservedIds.reviewId, /^[0-9a-f-]{36}$/);
  assert.match(reservedIds.ratingId, /^[0-9a-f-]{36}$/);
});

test('Phase 3 migration preservation: University.slug and CommunityMembership pair reject duplicates', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'uni-membership-duplicates' });
  try {
    await assert.rejects(
      prisma.university.create({
        data: {
          name: 'Duplicate University Slug',
          slug: fixture.university.slug,
        },
      }),
      assertPrismaUniqueViolation,
    );

    await assert.rejects(
      prisma.communityMembership.create({
        data: {
          userId: fixture.user.id,
          universityId: fixture.university.id,
        },
      }),
      assertPrismaUniqueViolation,
    );

    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_universityId: {
          userId: fixture.user.id,
          universityId: fixture.university.id,
        },
      },
      include: { user: true, university: true },
    });
    assert.equal(membership?.user.id, fixture.user.id);
    assert.equal(membership?.university.id, fixture.university.id);
  } finally {
    await fixture.cleanup();
  }
});

test('Phase 3 migration preservation: User.email and User.supabaseUserId reject duplicates', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'user-duplicates' });
  try {
    await assert.rejects(
      prisma.user.create({
        data: {
          email: fixture.user.email,
          name: 'Duplicate Email User',
          provider: 'google',
          supabaseUserId: `${fixture.prefix}-duplicate-email-supabase`,
        },
      }),
      assertPrismaUniqueViolation,
    );

    await assert.rejects(
      prisma.user.create({
        data: {
          email: `${fixture.prefix}-duplicate-supabase@campuscrypt.dev`,
          name: 'Duplicate Supabase User',
          provider: 'google',
          supabaseUserId: fixture.user.supabaseUserId,
        },
      }),
      assertPrismaUniqueViolation,
    );
  } finally {
    await fixture.cleanup();
  }
});

test('Phase 3 migration preservation: UserProfile username and userId reject duplicates', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'profile-duplicates' });
  try {
    await assert.rejects(
      prisma.userProfile.create({
        data: {
          userId: fixture.secondaryUser.id,
          username: fixture.profile.username,
          displayName: 'Duplicate Username Profile',
        },
      }),
      assertPrismaUniqueViolation,
    );

    await assert.rejects(
      prisma.userProfile.create({
        data: {
          userId: fixture.user.id,
          username: `${fixture.prefix}-secondprofile`,
          displayName: 'Duplicate UserId Profile',
        },
      }),
      assertPrismaUniqueViolation,
    );
  } finally {
    await fixture.cleanup();
  }
});

test('Phase 3 migration preservation: existing foreign-key relations and cascades survive unchanged', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'foreign-key-relations' });
  try {
    const userRelations = await prisma.user.findUnique({
      where: { id: fixture.user.id },
      include: {
        authIdentities: true,
        sessions: true,
        profile: true,
        communityMemberships: { include: { university: true } },
      },
    });

    assert.equal(userRelations?.authIdentities.some((identity) => identity.id === fixture.authIdentity.id), true);
    assert.equal(userRelations?.sessions.some((session) => session.id === fixture.session.id), true);
    assert.equal(userRelations?.profile?.id, fixture.profile.id);
    assert.equal(
      userRelations?.communityMemberships.some(
        (membership) =>
          membership.id === fixture.membership.id
          && membership.university.id === fixture.university.id,
      ),
      true,
    );

    const universityRelations = await prisma.university.findUnique({
      where: { id: fixture.university.id },
      include: { memberships: { include: { user: true } } },
    });
    assert.equal(
      universityRelations?.memberships.some(
        (membership) => membership.user.id === fixture.user.id,
      ),
      true,
    );

    await prisma.user.delete({ where: { id: fixture.user.id } });

    assert.equal(await prisma.authIdentity.findUnique({ where: { id: fixture.authIdentity.id } }), null);
    assert.equal(await prisma.session.findUnique({ where: { id: fixture.session.id } }), null);
    assert.equal(await prisma.userProfile.findUnique({ where: { id: fixture.profile.id } }), null);
    assert.equal(await prisma.communityMembership.findUnique({ where: { id: fixture.membership.id } }), null);
  } finally {
    await fixture.cleanup();
  }
});
