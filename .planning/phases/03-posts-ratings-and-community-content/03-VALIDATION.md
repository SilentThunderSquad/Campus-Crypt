---
phase: "03"
slug: "posts-ratings-and-community-content"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-21"
---

# Phase 03 - Validation Strategy

## Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Node.js `node:test` |
| Config file | `server/package.json` |
| Quick run command | `npm --prefix server test -- --test-name-pattern="Phase 3\|nested\|reply\|IDOR\|ownership\|rating\|review\|aggregate"` |
| Full suite command | `npm --prefix server test && npm --prefix server run build && npm --prefix client run build` |
| Estimated runtime | ~60 seconds |

## Mandatory Plan 01 Wave 0 Gate

Plan 01 is blocked until Wave 0 infrastructure and migration-preservation tests pass.

- Required file: `server/tests/fixtures/phase3-fixtures.js`
- Required file: `server/tests/phase3-migration-preservation.test.js`
- Required file: `server/tests/phase3-posts-comments.integration.test.js`
- Required file: `server/tests/phase3-ratings.integration.test.js`
- Blocking command: `npm --prefix server test -- --test-name-pattern="Phase 3 migration preservation"`
- Gate rule: If the dedicated suite or `prisma validate` fails, stop immediately. Do not edit the Prisma schema, create or apply migrations, or implement Phase 3 source/UI code. Plan 02 is blocked until Plan 01 and this gate pass again after Plan 01 migrations.

## Sampling Rate

- After every task commit: Run the task verification command.
- After every plan wave: Run the full server suite, server build, and client build.
- Before `/gsd-verify-work`: Full suite must be green.
- Max feedback latency: 60 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-00 | 01 | 0 | Migration preservation | T-03-01/T-03-02/T-03-03 | Existing constraint and FK preservation; isolated fixture cleanup | migration-preservation integration | `npm --prefix server test -- --test-name-pattern="Phase 3 migration preservation"; npm --prefix server exec prisma validate -- --schema prisma/schema.prisma` | ❌ W0 | ⬜ blocked |
| 03-01-01 | 01 | 1 | Content creation | T-03-01/T-03-02/T-03-03 | Verified post creation; public safe feed; identity from req.user; depends on 03-01-00 pass | integration | `npm --prefix server test -- --test-name-pattern="Phase 3.*post"; npm --prefix server test -- --test-name-pattern="Phase 3 migration preservation"` | ❌ W0 | ⬜ blocked by W0 |
| 03-01-02 | 01 | 1 | Content creation | T-03-01/T-03-02/T-03-03 | Replies, author-only post edits, comment edit omitted, parent mismatch rejection; depends on 03-01-00 and 03-01-01 pass | integration | `npm --prefix server test -- --test-name-pattern="nested\|reply\|IDOR\|ownership"` | ❌ W0 | ⬜ blocked |
| 03-01-03 | 01 | 1 | Community feed | T-03-03 | Feed rendering and public route integration without comment-edit UI; depends on 03-01-00, 03-01-01, and 03-01-02 pass | integration/build | `npm --prefix client run build && npm --prefix server test -- --test-name-pattern="community feed\|post"` | ❌ W0 | ⬜ blocked |
| 03-02-01 | 02 | 2 | Ratings and review model | T-03-04/T-03-05/T-03-06 | Verified review submission and derived aggregates; blocked by Plan 01 and Wave 0 passing | integration | `npm --prefix server test -- --test-name-pattern="Phase 3.*rating\|review\|aggregate"` | ❌ W0 | ⬜ blocked |
| 03-02-02 | 02 | 2 | Ratings and review model | T-03-04/T-03-05/T-03-07 | Duplicate, range, IDOR, and Plan 02 migration-preservation checks; blocked by Plan 01/Wave 0 | integration | `npm --prefix server test -- --test-name-pattern="review.*(guest\|unverified\|verified\|admin\|duplicate\|IDOR\|scope)\|aggregate"` | ❌ W0 | ⬜ blocked |
| 03-02-03 | 02 | 2 | Community feed and university UI | T-03-07 | Public aggregate/review display and existing route integration; blocked by Plan 01/Wave 0 | integration/build | `npm --prefix client run build && npm --prefix server test -- --test-name-pattern="community feed\|rating\|review"` | ❌ W0 | ⬜ blocked |

## Wave 0 Requirements

- [ ] `server/tests/fixtures/phase3-fixtures.js`
- [ ] `server/tests/phase3-migration-preservation.test.js`
- [ ] `server/tests/phase3-posts-comments.integration.test.js`
- [ ] `server/tests/phase3-ratings.integration.test.js`
- [ ] Test DB fixtures and cleanup for isolated universities, users, auth identities, sessions, profiles, memberships, posts, comments, reviews, and ratings
- [ ] Migration-preservation assertions preserve University.slug unique; User.email unique; User.supabaseUserId unique; CommunityMembership (userId, universityId) unique; UserProfile.username and userId uniqueness; and existing User/AuthIdentity/Session/UserProfile plus University/CommunityMembership foreign-key relationships
- [ ] Migration-preservation assertions also cover new Post/Comment and, where present, Review/Rating foreign-key relationships
- [ ] Server build syntax coverage for all Phase 3 services/routes
- [ ] Comment-edit test and implementation file expectations are excluded

Existing infrastructure covers the server test runner and builds; dedicated Phase 3 test files are still required.

## Manual-Only Verifications

All Phase 3 behaviors have planned automated verification. No manual-only behavior is required.

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Plan 01 Task 1 passes before any schema/migration/source mutation
- [ ] Plan 01 migrations are stopped if migration-preservation rerun fails
- [ ] Plan 02 has dependency on Plan 01 plus the Wave 0 gate
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60 seconds
- [ ] `nyquist_compliant: true` set after execution verification

**Approval:** pending
