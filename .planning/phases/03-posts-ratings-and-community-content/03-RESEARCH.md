# Phase 3: Posts, Ratings, and Community Content - Research

**Researched:** 2026-11-21
**Domain:** University community posts, nested discussions, university reviews/ratings, and aggregate scores
**Confidence:** HIGH

## Summary

Phase 3 should extend the completed Phase 2 foundation without replacing or bypassing it. The existing schema already defines `University`, `CommunityMembership`, `UserProfile`, and database-backed `UserRole`/`VerificationStatus`; Phase 3 should add only posts, comments, reviews/ratings, and enough aggregate state to support university score pages. Public reads remain open, while standalone post creation and university rating require verified users. Existing unverified users remain permitted to reply within existing discussions, per the SRS.

The implementation should use PostgreSQL as the source of truth and Express/Prisma as the authorization and data boundary. Nested comments should be a single parent-linked comment table with depth or count limits in application policy, not a denormalized comment tree. Ratings should be one review/rating record per verified user per university, with category scores in a child table or one fixed JSON/object shape only if required checks are explicit. The aggregate score should be derived at read time or maintained transactionally; an additional UniversityScore record is justified only if measured read volume requires it.

**Primary recommendation:** Add `Post`, `Comment`, `UniversityReview`, and `Rating` models; require `requireVerifiedUser` for posts/reviews and ownership checks for edits; use parent-comment and author/university foreign keys; derive aggregate category scores from current review rows first, with a documented snapshot fallback only if performance testing proves a materialized cache necessary.

<user_constraints>
## User Constraints (from CONTEXT.md)

No `CONTEXT.md` was present for Phase 3. The roadmap and root SRS are therefore the governing scope. The following locked scope boundaries apply:

### Locked Decisions
- Verified users can publish posts and reviews.
- Unverified users can read and reply within existing discussions but cannot create standalone posts.
- Rating data feeds university aggregate scores.
- Preserve existing Supabase Auth, database-backed authorization, University, CommunityMembership, and UserProfile behavior.
- Preserve `/u/{slug}` and `/profile/{username}` pathname routing behavior.
- Use the existing Express, Prisma, Supabase PostgreSQL, and React/Vite architecture.

### the agent's Discretion
- Choose concrete field names, indexes, limits, pagination, and aggregate implementation details within the SRS.
- Choose whether Phase 3 feed aggregation is a read-time join or a later materialized feed.

### Deferred Ideas (OUT OF SCOPE)
- Q&A
- voting
- following
- notifications
- messaging
- moderation dashboard and admin moderation tooling
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-------------|
| Content creation | Verified posts; unverified replies; edit/visibility rules | Post/comment model, verified middleware, ownership/author checks, soft-delete or visibility fields |
| Ratings and review model | Attribute ratings and review identity/association | UniversityReview and UniversityRating models, unique user/university constraint, category and range validation |
| Community feed | Posts/reviews appear in the university community feed | Feed query combining post/review records by university, cursor pagination, public visibility |
| Security and access control | Database-backed authorization and IDOR prevention | Backend ownership/university checks before every mutation and read of protected resources |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Post/comment/review creation | API / Backend | Database / Storage | Supabase identity is resolved, Campus Crypt user state is loaded, and only the backend authorizes and writes |
| Post/comment/review persistence | Database / Storage | API / Backend | PostgreSQL relations and constraints provide uniqueness, referential integrity, and transactional consistency |
| University aggregate calculation | Database / Storage | API / Backend | PostgreSQL aggregation is authoritative; API exposes derived results rather than client-calculated scores |
| University feed rendering | Browser / Client | Frontend Server (SSR) | React renders API-provided feed items; pathname routing and auth/verification affordances remain UX-only |
| Membership/author/verification checks | API / Backend | Database / Storage | Existing middleware loads current database-backed user state; DB constraints add a final integrity boundary |

## Project Constraints (from copilot-instructions.md)

No `copilot-instructions.md` exists in the repository root. No additional repository-specific directives were available.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Express | 5.2.1 | REST routes and middleware | Existing server dependency and route/authorization pattern [VERIFIED: server/package.json] |
| Prisma | 5.22.0 | PostgreSQL ORM and migrations | Existing schema and Prisma client used for application persistence [VERIFIED: server/package.json; server/prisma/schema.prisma] |
| Supabase PostgreSQL | current managed service | Persistent data source | Existing authoritative datasource with `DATABASE_URL` and `DIRECT_URL` [VERIFIED: server/prisma/schema.prisma] |
| Supabase Auth | 2.55.0 in client/server | Identity and bearer session resolution | Existing Google/Supabase authentication path [VERIFIED: server/package.json; client/package.json] |
| React / Vite | 18.2.0 / 8.2.2 | UI and pathname routing | Existing frontend implementation [VERIFIED: client/package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js `node:test` | runtime-provided | HTTP/unit/integration tests | Existing test convention [VERIFIED: server/package.json; server/tests/*.test.js] |
| Prisma interactive transactions | 5.22.0 | Atomic review/aggregate writes | Use only for operations that must update multiple rows atomically |

**Installation:** No new package is required for Phase 3. [VERIFIED: existing package manifests and schema]

**Version verification:** Existing versions were read from `server/package.json`, `client/package.json`, and `server/prisma/schema.prisma`. No package installation is planned.

## Package Legitimacy Audit

No external package is proposed for installation. Existing packages were not newly discovered or recommended as package additions.

| Package | Registry | Verdict | Disposition |
|---------|----------|---------|-------------|
| None | — | — | No package changes |

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious SUS:** none

## Architecture Patterns

### Recommended Project Structure

```text
server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── routes/
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   └── reviewRoutes.js
│   ├── services/
│   │   ├── postService.js
│   │   ├── discussionService.js
│   │   └── universityRatingService.js
│   └── validators/
│       └── contentValidators.js
client/src/pages/
├── university/
├── community/
└── profile/
```

### System Architecture Diagram

```text
Guest / Authenticated browser
  |
  | GET public feed/post/review
  | POST/PUT/DELETE with Supabase bearer session
  v
Express route + validation
  |
  | requireAuth / requireVerifiedUser / ownership check
  v
Phase 3 service
  |
  | Prisma queries/transactions
  v
Supabase PostgreSQL
  University <1---* CommunityMembership
     |
     +<1---* Post
     |       +<1---* Comment
     +<1---* UniversityReview
             +<1---* UniversityRating
  |
  v
Aggregate result / nested discussion / edit response
  |
  v
React `/u/:slug/feed`, `/u/:slug`, `/profile/:username`
```

### Pattern 1: Parent-linked comment tree

**What:** Store comments in one `Comment` table with `postId`, `authorId`, `parentCommentId`, `body`, and timestamps. Load a post and a bounded comment set, then build nested UI shape in the API/service or client.

**When to use:** This is the minimum model that supports nested replies and ownership checks without a closure-table migration.

**Example:**

```text
Comment
  id
  postId -> Post.id
  authorId -> User.id
  parentCommentId -> Comment.id? (NULL at thread root)
  body
  createdAt
  updatedAt
```

Use a database check or service transaction to ensure `parentCommentId` belongs to the same post and does not create a cycle. Cap reply depth or loaded depth at a product-defined constant during detailed planning. An arbitrary database depth is not required by the SRS.

### Pattern 2: One review per university per user

**What:** Store a `UniversityReview` header with unique `(userId, universityId)`, and a `UniversityRating` child for category/value rows, or define fixed category columns directly only when category requirements are immutable.

**When to use:** A normalized category table supports adding categories later and enforces referential integrity. A unique review row prevents duplicate university ratings from one user.

**Example:**

```text
UniversityReview
  id
  universityId
  userId
  title?          // optional, only if text review is required
  body?           // optional, only if text review is required
  createdAt
  updatedAt

  UNIQUE(userId, universityId)

UniversityRating
  reviewId
  category
  score
  UNIQUE(reviewId, category)
```

No fake review text fields should be invented as required behavior. The SRS requires review content associated with identities and category ratings.

### Pattern 3: Transactional aggregate by query

**What:** Compute category averages and overall score from `UniversityRating` rows for the university, using Prisma `aggregate`/`groupBy` or a PostgreSQL aggregate query.

**When to use:** Start with read-time aggregation and indexes; only introduce `UniversityAggregate` if load testing shows unacceptable latency.

Official Prisma supports `aggregate` for `_avg`, `_count`, and `_sum`, and `groupBy` for aggregating rows within groups. PostgreSQL `avg()` returns a numeric result for integer/numeric inputs. [CITED: https://www.prisma.io/docs/orm/v6/prisma-client/queries/aggregation-grouping-summarizing; https://www.postgresql.org/docs/16/functions-aggregate.html]

### Anti-Patterns to Avoid

- **Client-calculated authorization:** Never accept `authorId`, `verificationStatus`, `role`, or `universityId` as trustable mutation inputs.
- **Comment ID-only ownership:** Resolve comment -> post -> university and author, then reject mismatched parents and ownership edits.
- **Multiple ratings from the same user:** Enforce `UNIQUE(userId, universityId)` in PostgreSQL, not only in UI code.
- **One-to-many rating columns in review JSON:** Avoid ad hoc JSON keys if category averages, indexing, or category validation matter.
- **Unbounded comment trees:** Return bounded root threads/replies and cursor-paginate continuation.
- **Trusting frontend route state:** `/u/:slug` and `/profile/:username` remain presentation routes; every mutation is authorized in Express.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication/session validation | Custom JWT issuance or in-memory sessions | Existing Supabase Auth verification flow | Supabase owns token/session infrastructure [VERIFIED: existing auth service and middleware] |
| Database relations/constraints | Application-only checks for uniqueness and foreign keys | Prisma models plus PostgreSQL constraints | Protect against race conditions and direct DB operations |
| Rating aggregation | Client-side sum/average in React | Prisma `aggregate`/`groupBy` or PostgreSQL aggregate query | Centralizes numeric behavior and avoids stale client values |
| Nested data loading | Recursive unbounded ORM lazy queries | Two-level or bounded comment query plus in-process tree assembly | Avoids N+1 and stack/volume abuse |
| Input sanitation | Regex-only HTML stripping | Strict allowlist/length validation and framework output escaping | Rich-text/XSS semantics require a deliberate design |
| Pagination | Increasing offsets for deep feeds | Cursor pagination on a unique createdAt/id pair | Stable under insertions and more efficient in growing feeds |

**Key insight:** Prisma nested writes provide transactional relation guarantees, but authorization must run before the write. Supabase RLS is defense-in-depth for exposed Supabase clients; it must not replace backend-authoritative Express authorization because the application access decision depends on current Campus Crypt `role`, `verificationStatus`, and restriction state. [CITED: https://www.prisma.io/docs/orm/v7/prisma-client/queries/relation-queries; https://supabase.com/docs/guides/database/postgres/row-level-security]

## Runtime State Inventory

Not applicable: Phase 3 adds models and features; it is not a rename/refactor/migration-only phase.

## Common Pitfalls

### Pitfall 1: Relying on JWT verification claims

**What goes wrong:** A stale role/verification claim permits or denies the wrong action.
**Why it happens:** Supabase identity metadata is confused with Campus Crypt application authorization.
**How to avoid:** Resolve the current `User` through `getUserFromRequest(req)` and enforce `verificationStatus === 'verified'` or `role === 'admin'` from that record.
**Warning signs:** Controllers use `req.user.user_metadata.role`, `req.user.user_metadata.verificationStatus`, or a claimed token field.

### Pitfall 2: IDOR through accepting resource IDs

**What goes wrong:** A caller edits/deletes another author's post/comment or places a comment under someone else's post/university.
**Why it happens:** Routes accept IDs and validate only authentication.
**How to avoid:** Load the resource, compare `authorId === req.user.id`, and ensure parent/comment/university/post IDs belong to the same scoped object.
**Warning signs:** Update/delete queries contain only `{ id: req.params.id }` and do not also scope `{ authorId: req.user.id }`.

### Pitfall 3: Duplicate or spoofed rating submissions

**What goes wrong:** A user creates several ratings or submits out-of-range category values.
**Why it happens:** Uniqueness and category constraints exist only in request validation.
**How to avoid:** Unique `(userId, universityId)` database constraint plus server range allowlist/constraint and verified-user middleware.
**Warning signs:** Rating endpoint uses `upsert` without first authorizing and explicit current-user identity.

### Pitfall 4: Recursive N+1 comment loading

**What goes wrong:** One post query becomes many comment queries and response payload grows without bound.
**Why it happens:** Recursive client or service traversal loads each parent separately.
**How to avoid:** Fetch comments in bounded batches with cursor pagination and assemble a tree in one pass.
**Warning signs:** Any comment service calls `findMany` from inside a loop or recursion.

### Pitfall 5: Aggregate drift

**What goes wrong:** Cached university averages diverge from rating rows.
**Why it happens:** Submit/update/delete paths update snapshots inconsistently.
**How to avoid:** Prefer derived aggregate reads first. If snapshots are later required, update them in the same transaction as the review mutation.
**Warning signs:** Separate average update code exists outside the review transaction.

### Pitfall 6: Scope creep into later phases

**What goes wrong:** Phase 3 ships voting, Q&A, follows, notifications, messages, or moderation as partial systems.
**Why it happens:** Similar feed and social fields are included speculatively.
**How to avoid:** Add only `Post`, `Comment`, `UniversityReview`, `UniversityRating`, and aggregate query support.
**Warning signs:** Vote, answer, follow, notification, conversation, report, or moderation fields appear in Phase 3 schema.

## Code Examples

### Verified Post Creation Boundary

```javascript
// Pattern, not implementation: route middleware verifies current DB state.
router.post('/api/universities/:slug/posts',
  requireAuth,
  requireVerifiedUser,
  validateCreatePost,
  postController.create,
);
```

The service must also reload the university by normalized slug and create the post with `authorId: req.user.id`, never a client-supplied author ID.

### Ownership-scoped mutation

```javascript
const deleted = await prisma.post.deleteMany({
  where: {
    id: postId,
    authorId: req.user.id,
  },
});
```

If `deleted.count !== 1`, return 404 or 403 according to the product's non-enumeration policy; do not disclose that the post belongs to someone else.

### Rating aggregation

```javascript
const aggregates = await prisma.universityRating.groupBy({
  by: ['category'],
  where: {
    review: { universityId },
  },
  _avg: { score: true },
  _count: { _all: true },
});
```

Prisma v5 syntax and relation filter support must be validated during implementation migration; the exact Prisma 5 API shape should be checked by compiling against the project schema.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------|--------------|--------|
| Client trust in role/verification flags | Backend DB-backed authorization | Phase 1 | Prevents stale JWT claim bypass |
| Dense nested JSON comment column | Parent-linked relational comment rows | Phase 3 recommendation | Supports indexable, paginated replies |
| Fixed precomputed aggregate on first design | Derived PostgreSQL aggregates first | Phase 3 recommendation | Avoids snapshot drift; add cache only after load evidence |
| Offset pagination for feeds | Cursor pagination with unique createdAt/id ordering | Current Prisma/PostgreSQL practice | Stable feeds under inserts |

**Deprecated/outdated:**
- Custom JWT issuance: excluded by the SRS final architecture.
- Custom in-memory sessions: excluded by Phase 1/SRS.
- Cloudinary: Supabase Storage is the final storage direction.
- Frontend-only route protection: UX only, never security.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Text title/body fields are needed on posts and reviews | Data model options | Fields can be omitted or changed, but migration cost is low before implementation |
| A2 | Category ratings use a 1-5 scale | Ratings pattern | The SRS names categories but gives no scale; wrong scale would invalidate existing review UI/API |
| A3 | Review text is optional | Ratings pattern | If the product requires mandatory textual review content, schema/API changes are needed |
| A4 | `Post.visibility` and `Comment.visibility` are not required by the SRS | Scope/pattern | Moderation fields are explicitly deferred, but future content removal may need a soft-delete field |
| A5 | No media attachment is required for Phase 3 posts/comments | Scope boundary | Supabase Storage is a future implementation dependency if post media is added |

## Resolved Implementation Details

The following items are implementation decisions, not additional SRS requirements:

1. **Rating scale and categories:** Use a 1-5 integer scale and normalized category rows. Include the SRS-named Academics, Faculty, Placements, Infrastructure, Campus Life, Hostel, Food, and Location categories. No category or scale is claimed to be otherwise mandated by the SRS.
2. **Nested reply depth and pagination:** Load two levels of nested UI depth and cap each comment batch at 20 records with cursor pagination. Parent replies beyond the first two levels remain accessible only through bounded continuation behavior.
3. **Post/comment edit and delete policy:** Permit author-only edits and expose no delete API in the initial Phase 3 implementation. Do not add moderation or visibility fields. `editedAt` may be stored by the mutation implementation as a timestamp detail.
4. **Membership for mutations:** Community membership is not required solely to create/reply/rate. Standalone posts and reviews require verified status; replies require authentication and an existing post; membership remains an independent Phase 2 join state unless a future policy changes it.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend/client scripts | ✓ | v26.13.1 | — |
| npm | Package/scripts | ✓ | 11.20.0 | — |
| Prisma CLI | Schema/migration validation | ✓ via project dependency | 5.22.0 declared | — |
| PostgreSQL/Supabase | Integration tests and migration | Not fully probed; existing environment config required | — | Block live DB verification without valid env |
| Supabase Auth config | HTTP auth integration | Existing project/env required | — | Document auth-blocked tests rather than fake success |

**Missing dependencies with no fallback:**
- Valid `DATABASE_URL`/`DIRECT_URL` and Supabase Auth test configuration for live integration verification.

**Missing dependencies with fallback:**
- None for static schema/API/test design; mock/unit tests can cover middleware and validators until live services are configured.

## Validation Architecture

Nyquist validation is enabled in `.planning/config.json` and this section is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js `node:test` |
| Config file | none; package script invokes tests |
| Quick run command | `npm --prefix server test` |
| Full suite command | `npm --prefix server test && npm --prefix server run build && npm --prefix client run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CREAT-POST | verified create, unverified reject | integration/unit | `node --test tests/phase3-posts.test.js` | ❌ Wave 0 |
| CREAT-COMMENT | guest reject, unverified/verified reply to existing post | integration/unit | `node --test tests/phase3-comments.test.js` | ❌ Wave 0 |
| CREAT-EDIT | author edit/delete; non-author reject; IDOR reject | integration/unit | `node --test tests/phase3-ownership.test.js` | ❌ Wave 0 |
| RATING-SUBMIT | verified submit, unique one review per university, range reject | integration/unit | `node --test tests/phase3-ratings.test.js` | ❌ Wave 0 |
| RATING-AGG | category and overall averages match stored ratings | DB/integration | `node --test tests/phase3-aggregates.test.js` | ❌ Wave 0 |
| FEED-PUBLIC | guests can read feed, non-existent slug safe 404 | HTTP/integration | `node --test tests/phase3-feed.test.js` | ❌ Wave 0 |
| FEED-ORDER | post/review feed cursor stable under insertion | integration/unit | `node --test tests/phase3-feed.test.js` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm --prefix server test`
- **Per wave merge:** `npm --prefix server test && npm --prefix server run build && npm --prefix client run build`
- **Phase gate:** Full suite green plus Prisma migration validation before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `server/tests/phase3-posts.test.js`
- [ ] `server/tests/phase3-comments.test.js`
- [ ] `server/tests/phase3-ownership.test.js`
- [ ] `server/tests/phase3-ratings.test.js`
- [ ] `server/tests/phase3-aggregates.test.js`
- [ ] `server/tests/phase3-feed.test.js`
- [ ] Test DB fixture setup/teardown for isolated university, user, post, comment, and review records

## Security Domain

Security enforcement is enabled because `.planning/config.json` does not set `security_enforcement: false`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase bearer session plus Express identity resolution |
| V3 Session Management | Yes | Existing Supabase session handling; no custom JWT/session |
| V4 Access Control | Yes | Verified/owner/parent resource checks; DB-backed current user state |
| V5 Input Validation | Yes | Express body validation, URL slug validation, category/range checks, size limits |
| V6 Cryptography | No direct Phase 3 implementation | Use existing Supabase/HTTPS mechanisms; never add custom secrets or crypto |

### Known Threat Patterns for the Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR: edit/delete another user's post/comment/review | Elevation of privilege/Tampering | Author-scoped update/delete predicates plus resource ownership lookup |
| Parent/child mismatch: reply attaches to wrong post | Tampering | Resolve parent comment and require `parent.postId === post.id` |
| Rating duplicate/race | Tampering | PostgreSQL unique `(userId, universityId)` constraint |
| Stale verification/role | Elevation of privilege | Reload current application `User` on each protected mutation |
| Script/HTML in title/body/review | Tampering/XSS | Strict length/type validation; React escaping; optional sanitizer library only if rich text is explicitly needed |
| Feed/discussion enumeration | Information disclosure | Stable 404/403 policy and public-field projections |
| Oversized or recursive payload | Denial of service | Request-size, body-length, depth/count, and pagination limits |
| SQL injection | Tampering | Prisma parameterization; no raw SQL unless parameterized and reviewed |

## Sources

### Primary (HIGH confidence)
- `server/prisma/schema.prisma` - existing models and enums [VERIFIED]
- `server/package.json` - existing Express/Prisma versions [VERIFIED]
- `client/package.json` - existing React/Vite/Supabase versions [VERIFIED]
- `.planning/ROADMAP.md` - Phase 3 scope and success criteria [VERIFIED]
- `.planning/phase-2/PLAN.md` - explicit Phase 2 behavior and future boundary [VERIFIED]
- Prisma official aggregation docs - aggregate/groupBy patterns [CITED]
- Prisma official relation docs - nested writes and relation behavior [CITED]
- Supabase official RLS docs - RLS is defense-in-depth [CITED]
- PostgreSQL official aggregate docs - `avg()` behavior [CITED]

### Secondary (MEDIUM confidence)
- Express official error-handling docs - centralized async/error handling pattern [CITED]
- OWASP web research did not return a directly authoritative IDOR page in this session, so IDOR prevention recommendations are grounded in the repository authorization model and in-repo tests [ASSUMED policy pattern].

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions and architecture are confirmed from in-repo manifests/schema
- Architecture: HIGH - existing routes/services/middleware and SRS establish the boundaries
- Data model: MEDIUM/HIGH - required entities are clear; exact rating scale/text fields remain open
- Pitfalls: HIGH - repository evidence plus standard authorization/IDOR patterns

**Research date:** 2026-11-21
**Valid until:** 2026-12-21
