# Phase 2 Implementation Plan

## 1. Phase intent

Phase 2 implements the SRS-defined foundation for university communities and public user profiles. It is intentionally limited to the community identity, routing, membership/access foundation, public profile URL layer, and a minimal community activity surface. It does not implement the later product systems that belong to Phase 3 and beyond.

The authoritative source of truth remains `Campus Crypt - SRS.md`. The completed Phase 2 research note is used as supporting analysis. Where the SRS and the repo planning differ, the SRS wins and the conflict is explicitly flagged.

## 2. Scope boundaries and explicit deferrals

### In Phase 2 scope
- University/community identity
- Unique URL-safe university/community slug
- Public university/community pages
- University information display
- Community membership/access foundation
- User public profile pages
- Unique URL-safe usernames
- Reserved username handling
- Profile route resolution
- Community feed foundation/activity surface
- Guest/unverified/verified/admin access boundaries
- Backend-authoritative authorization
- Core server-side validation and security checks

### Explicitly deferred to Phase 3+
- full discussion/post creation system
- university reviews and ratings
- Q&A system
- voting
- follow system
- notifications
- private messaging
- moderation dashboard and admin moderation tooling
- any advanced content feed logic that depends on those systems

### Feed boundary
The SRS allows the community feed to contain posts, discussions, reviews, Q&A activity, and community interactions, but the SRS does not require those systems to be implemented in Phase 2. Phase 2 therefore implements only the feed container and permission-based surface that can host future content, without adding the later content systems themselves.

## 3. SRS compliance review

### Directly supported Phase 2 SRS sections
- SRS §3.1: Guest Users
- SRS §3.2: Authenticated Unverified Users
- SRS §3.3: Verified Users
- SRS §3.4: Admin Users
- SRS §4.2: Authentication and Application Authorization
- SRS §4.5: University Community System
- SRS §4.6: User Profiles
- SRS §4.7: Community Feed

### Requirements intentionally not included in Phase 2
- SRS §4.8 Discussion and Posts — deferred
- SRS §4.9 University Reviews and Ratings — deferred
- SRS §4.10 Q&A System — deferred
- SRS §4.11 Voting System — deferred
- SRS §4.12 Follow System — deferred
- SRS §4.13 Notification System — deferred
- SRS §4.14 Private Messaging — deferred

### Planning conflict note
The existing roadmap and planning artifacts describe Phase 2 in a shorter form than the SRS. The roadmap summary is directionally aligned but not exhaustive. The SRS remains authoritative and is used to expand the exact Phase 2 requirements. No direct conflict is found that requires replacing the SRS; the plan below preserves the SRS as the final arbiter.

## 4. Existing foundation to build on

### Phase 1 foundation already available
- `server/prisma/schema.prisma`
- Prisma `User` model with `role`, `verificationStatus`, `supabaseUserId`, `provider`, `authIdentities`, `sessions`, audit logging
- `server/src/config/db.js` shared Prisma singleton
- `server/src/services/authService.js` identity sync and Supabase Auth integration
- `server/src/config/env.js` env configuration
- Express app/server routing structure under `server/src/routes` and `server/src/middleware`
- React/Vite frontend structure under `client/src`

### These must not be duplicated
- custom Google OAuth callbacks
- custom JWT issuance or session storage
- legacy custom auth/session flows
- Cloudinary-dependent storage approach
- frontend-only authorization

## 5. Minimum data model plan

This plan preserves the existing Phase 1 `User` model and adds only the minimum additional data necessary for the SRS-defined Phase 2 functionality.

### Proposed model: `University`

Required by SRS §4.5.

Fields:
- `id` — standard UUID primary key
- `name` — university/community name
- `slug` — unique URL-safe slug
- `description` — university/community summary
- `website` — optional official website; `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- `location` — optional geographic metadata; `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- `createdAt` — created timestamp
- `updatedAt` — updated timestamp

Fields explicitly not required by SRS and therefore not planned unless later requirements clarify them:
- `coverImageUrl` — `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- `isActive` — `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- `isFeatured` — `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- `status` or moderation fields — `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`

### Proposed model: `CommunityMembership`

Required by SRS §4.5 and §3.3.

Fields:
- `id`
- `userId`
- `universityId` (or communityId depending on naming)
- `joinedAt`
- `updatedAt`

Constraints:
- unique `(userId, universityId)`

Fields not required by SRS and therefore excluded:
- approval workflow state — `NOT SPECIFIED IN SRS`
- membership request queue — `NOT SPECIFIED IN SRS`
- ban/restrict state as a community permission field — `NOT SPECIFIED IN SRS`
- moderation flags — `NOT SPECIFIED IN SRS`

### Proposed model: `UserProfile`

Required by SRS §4.6.

Fields:
- `id`
- `userId`
- `username` — unique, URL-safe
- `displayName` — public display name
- `bio` — optional summary; `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- `avatarUrl` — optional reference; `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- `createdAt`
- `updatedAt`

Required by SRS:
- unique username
- public profile representation
- shareable URL

Fields not supported by SRS and therefore not planned in Phase 2:
- profile privacy settings — `NOT SPECIFIED IN SRS`
- profile edit controls — `NOT SPECIFIED IN SRS`
- follower/following tables — deferred to later social phases

### Proposed model boundary for feed
The SRS requires a community feed but not a concrete feed schema. Phase 2 should not add speculative feed tables with non-SRS content semantics. Instead, the implementation should establish a feed service and route that queries already-supported community activity data in a future-safe way without creating Phase 3 content models.

### Profile editing and visibility
- Editing profile data is not explicitly required by the SRS.
- Visibility/privacy toggles are not specified in the SRS.
- This plan therefore excludes profile editing and privacy controls unless the SRS later clarifies them.
- `Profile editing behavior: NOT SPECIFIED IN SRS`
- `Profile privacy behavior: NOT SPECIFIED IN SRS`

## 6. Phase 2 tasks

### Task 2.1 — Define Phase 2 domain and route contract
Objective: Confirm the minimal SRS-based Phase 2 domain objects, public routes, and authorization rules before implementation.

SRS requirements:
- §4.2 Authentication and Application Authorization
- §4.5 University Community System
- §4.6 User Profiles
- §4.7 Community Feed

Existing files/components it depends on:
- `.planning/phase-2/RESEARCH.md`
- `.planning/phase-1/PLAN.md`
- `server/prisma/schema.prisma`
- `server/src/config/db.js`
- `server/src/services/authService.js`
- `client/src` app skeleton

Files to create:
- `.planning/phase-2/PLAN.md` (this document)

Files to modify:
- none during planning stage

Database/schema changes:
- none in this planning-only task

API changes:
- none in this planning-only task

Frontend/routing changes:
- none in this planning-only task

Authorization/security requirements:
- confirm backend-authoritative access model stays in place

Tests required:
- requirements review check against SRS

Acceptance criteria:
- every Phase 2 task traces to SRS language
- deferred Phase 3/4 work is explicitly excluded

Dependencies on earlier Phase 2 tasks:
- none

---

### Task 2.2 — Add Phase 2 schema foundation for university/community identity
Objective: Add the minimum data model required for a university/community entity with unique URL-safe slug and public access surface.

SRS requirements:
- §4.5 University Community System

Existing files/components it depends on:
- `server/prisma/schema.prisma`
- existing Prisma `User` model
- shared Prisma client

Files to create:
- `server/prisma/migrations/` new migration file only when implementation begins; not in this planning stage
- `server/src/services/universityService.js` (planned implementation file)

Files to modify:
- `server/prisma/schema.prisma` (planned future implementation)

Database/schema changes:
- Add `University` model with `slug` unique constraint
- `slug` must be URL-safe and unique
- `CommunityMembership` relationship table for users joining communities
- `University` fields limited to SRS-relevant data only
- `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS` for optional metadata such as website, location, cover image, status flag

API changes:
- `GET /api/universities`
- `GET /api/universities/:slug`

Frontend/routing changes:
- `/u/:slug` route

Authorization/security requirements:
- guest can view public university pages
- server-side membership/access checks derive from database state
- no frontend-only role enforcement

Tests required:
- Prisma validation for unique slug and member association
- API tests for public view access and route resolution
- authorization tests for guest vs verified vs admin access

Acceptance criteria:
- university/community records have unique slug values
- public university page is reachable by slug
- no duplicate slugs allowed
- invalid slug handling is safe

Dependencies on earlier Phase 2 tasks:
- Task 2.1

---

### Task 2.3 — Add university/community membership and access foundation
Objective: Support the SRS-required distinction between public browsing and community participation while keeping membership as a minimal required foundation.

SRS requirements:
- §3.2 Authenticated Unverified Users
- §3.3 Verified Users
- §4.5 University Community System
- §4.2 Authentication and Application Authorization

Existing files/components it depends on:
- `server/src/config/db.js`
- `server/src/services/authService.js`
- existing backend auth middleware

Files to create:
- `server/src/services/communityMembershipService.js`
- `server/src/routes/communityMembership.js`

Files to modify:
- `server/src/middleware/auth.js` or equivalent auth middleware (future implementation)
- backend authorization middleware files (future implementation)

Database/schema changes:
- `CommunityMembership` with unique user/community pair
- membership relation tied to `User` and `University`
- fields limited to `userId`, `universityId`, `joinedAt`, `updatedAt`
- not adding approval workflow, moderation fields, or ban flags unless later requirements specify them

API changes:
- `GET /api/universities/:slug/membership-status`
- `POST /api/universities/:slug/join`
- `POST /api/universities/:slug/leave`

Frontend/routing changes:
- join button or membership state UI on university page
- no extra admin management UI in Phase 2

Authorization/security requirements:
- only verified users may join and participate in community membership actions
- backend resolves current `role` and `verificationStatus` from DB
- client-submitted membership state is untrusted

Tests required:
- API tests for guest rejection, unauthenticated rejection, unverified rejection, verified join success
- DB tests for unique membership rows

Acceptance criteria:
- verified users may join a community
- unverified users cannot claim membership access beyond the SRS-defined public browsing permissions
- membership queries are server-authoritative

Dependencies on earlier Phase 2 tasks:
- Task 2.2

---

### Task 2.4 — Implement user profile identity and URL-safe username validation
Objective: Add the SRS-required public user profile system with unique, URL-safe usernames and a stable public profile route.

SRS requirements:
- §4.6 User Profiles
- §4.2 Authentication and Application Authorization

Existing files/components it depends on:
- `server/prisma/schema.prisma`
- `server/src/config/db.js`
- existing `User` model
- existing auth middleware

Files to create:
- `server/src/services/profileService.js`
- `server/src/validators/profileValidators.js`
- `server/src/routes/profile.js`

Files to modify:
- `server/prisma/schema.prisma` (future implementation)

Database/schema changes:
- `UserProfile` with unique `username`
- `userId` one-to-one relationship to `User`
- `displayName` plus optional profile summary fields only if directly needed for public profile rendering
- `bio` and `avatarUrl` are `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS`
- profile privacy toggles are `NOT SPECIFIED IN SRS`
- follow tables are deferred beyond Phase 2

API changes:
- `GET /api/users/:username`
- `GET /api/users/me/profile` only if profile context is needed; this is an implementation choice, not an SRS requirement

Frontend/routing changes:
- `/profile/:username` route
- public profile page template

Authorization/security requirements:
- profile retrieval must be publicly accessible when the page is public
- profile writes must be protected by backend auth and ownership validation only if a write API is included
- no client-trusted role or verification status
- reserved username rejection at server level

Tests required:
- username uniqueness tests
- reserved-word tests
- invalid-slug/invalid-username validation tests
- route tests for valid and missing user profile pages

Acceptance criteria:
- usernames are unique and URL-safe
- reserved names are rejected
- the public route resolves to the correct profile
- duplicate usernames are rejected at the server boundary

Dependencies on earlier Phase 2 tasks:
- Task 2.1
- Task 2.2

---

### Task 2.5 — Build the public community feed foundation
Objective: Implement the minimal feed surface required by SRS §4.7 without introducing later content systems.

SRS requirements:
- §4.7 Community Feed
- §4.5 University Community System

Existing files/components it depends on:
- `server/src/routes` pattern
- `server/src/services` pattern
- existing `University` and membership models
- Phase 3+ content systems are not yet present

Files to create:
- `server/src/services/communityFeedService.js`
- `server/src/routes/communityFeed.js`
- `client/src/pages/community/CommunityFeedPage.jsx` or equivalent future frontend file

Files to modify:
- community page router and page shell in client

Database/schema changes:
- no new feed table required in Phase 2 unless the product explicitly requires a minimal aggregate model
- the feed should be modeled as a query/service layer that reads from existing community content data when present, not as a new creation mechanism for Phase 3 features
- `IMPLEMENTATION DETAIL — NOT SPECIFIED IN SRS` for feed item schema or feed materialization

API changes:
- `GET /api/universities/:slug/feed`

Frontend/routing changes:
- community feed page mounted under `/u/:slug` or `/u/:slug/feed`
- feed renders only permitted activity

Authorization/security requirements:
- feed visibility must respect guest/unverified/verified/admin rules
- only publicly permitted community activity is exposed to unauthorized users
- backend authorization remains authoritative

Tests required:
- page access tests for guests/unverified/verified/admin across community feed
- feed filtering tests for permission-based visibility
- not-implemented Phase 3 content must remain deferred

Acceptance criteria:
- community feed route resolves and filters according to current auth state
- no Phase 3 feature is implemented as a prerequisite in Phase 2
- feed is limited to the SRS-defined “relevant community activity” surface

Dependencies on earlier Phase 2 tasks:
- Task 2.2
- Task 2.3

---

### Task 2.6 — Add backend authorization and route guard enforcement for Phase 2 resources
Objective: Enforce the SRS access model using current server-side application state.

SRS requirements:
- §3.1 Guest Users
- §3.2 Authenticated Unverified Users
- §3.3 Verified Users
- §3.4 Admin Users
- §4.2 Authentication and Application Authorization

Existing files/components it depends on:
- existing Phase 1 auth middleware
- current `User` model and DB-backed role and verification state
- existing server route patterns

Files to create:
- `server/src/middleware/phase2Authorization.js` or equivalent
- `server/src/services/accessControlService.js`

Files to modify:
- protected route definitions in the backend
- route-level access checks for community/profile endpoints

Database/schema changes:
- no new schema required beyond membership data
- access decisions use current `User.role`, `User.verificationStatus`, and membership state in DB

API changes:
- public vs protected route enforcement for university and profile endpoints
- admin-only endpoints reserved for admin access only

Frontend/routing changes:
- UI elements reflect access states only as UX, never as the security boundary

Authorization/security requirements:
- guest, unverified, verified, and admin are each checked server-side
- no trust in frontend role or verificationStatus
- no trust in client-provided membership state
- no trust in stale JWT claims for role or verification status
- admin checks use database-backed admin state

Tests required:
- route authorization tests for guest, unverified, verified, admin
- DB-backed authorization tests to ensure stale metadata cannot bypass permissions
- IDOR prevention tests for profile/community resource access

Acceptance criteria:
- unauthorized access is rejected
- admin-only routes remain protected
- user and community resources cannot be accessed by ID guessing or route tampering alone

Dependencies on earlier Phase 2 tasks:
- Task 2.2
- Task 2.3
- Task 2.4

---

### Task 2.7 — Implement validation and security controls for slugs, usernames, and profile/community routes
Objective: Enforce SRS-required uniqueness and URL-safe constraints for all Phase 2 resource identifiers.

SRS requirements:
- §4.5 Unique URL slug
- §4.6 Unique usernames and URL-safe username rules
- §4.2 Backend authorization

Existing files/components it depends on:
- `server/src/validators` pattern if present
- profile and university service modules

Files to create:
- `server/src/validators/universityValidators.js`
- `server/src/validators/profileValidators.js`
- `server/src/utils/safeSlug.js` or equivalent validation utility

Files to modify:
- validation middleware and controller input checks

Database/schema changes:
- unique constraints on `University.slug` and `UserProfile.username`
- no speculative privacy or hidden field controls

API changes:
- route validation for invalid slugs and invalid usernames
- reject duplicates and reserved names server-side

Frontend/routing changes:
- invalid slug/username UX messaging only if necessary, but not as the security boundary

Authorization/security requirements:
- validation and uniqueness checks happen on the server
- reserved username handling must be server-enforced
- route access remains backend-authoritative

Tests required:
- invalid slug rejection tests
- duplicate slug rejection tests
- invalid username rejection tests
- reserved-word tests

Acceptance criteria:
- slug and username uniqueness are enforced
- invalid or reserved identifiers are rejected
- public routes remain stable and safe

Dependencies on earlier Phase 2 tasks:
- Task 2.2
- Task 2.4
- Task 2.6

---

### Task 2.8 — Phase 2 integration validation and acceptance review
Objective: Verify the Phase 2 implementation passes the required SRS checks without drifting into Phase 3+ functionality.

SRS requirements:
- all Phase 2 requirements above

Existing files/components it depends on:
- completed Phase 2 tasks and all relevant backend/frontend code

Files to create:
- no new source files required

Files to modify:
- none for planning-only review

Database/schema changes:
- none beyond previously approved Phase 2 schema work

API changes:
- none beyond earlier Phase 2 endpoints

Frontend/routing changes:
- ensure routes are limited to `/u/:slug`, `/profile/:username`, and minimal supporting pages

Authorization/security requirements:
- confirm all access checks are backend-driven
- confirm no Phase 3 social or moderation features are inadvertently introduced

Tests required:
- route tests for protected/public behavior
- authorization matrix tests
- slug/username tests
- integration tests covering public and protected community/profile access

Acceptance criteria:
- all Phase 2 behaviors satisfy SRS requirements
- no Phase 3/4 content systems are present
- backend authorization remains authoritative
- Phase 2 is ready to hand off for implementation without entering later phases

Dependencies on earlier Phase 2 tasks:
- Task 2.2 through Task 2.7

## 7. Detailed implementation notes by topic

### 7.1 User profile handling
- Unique usernames are required by SRS §4.6.
- URL-safe usernames are required by SRS §4.6.
- Reserved username protection is required by SRS §4.6.
- Public profile URLs are required by SRS §4.6.
- Profile editing and profile privacy behavior are not specified in the SRS.
- Therefore: `Profile editing: NOT SPECIFIED IN SRS`
- Therefore: `Profile visibility/privacy controls: NOT SPECIFIED IN SRS`

### 7.2 University/community handling
- Unique community identity and unique slug are required by SRS §4.5.
- Public university page route `/u/{slug}` is required by SRS §4.5.
- University information display is required.
- Membership relationship is required by SRS §4.5 and §3.3.
- No approval workflow, admin management UI, or seeding strategy is required in Phase 2.
- Therefore: `University creation workflow: NOT SPECIFIED IN SRS`
- Therefore: `University approval workflow: NOT SPECIFIED IN SRS`
- Therefore: `University admin management UI: NOT SPECIFIED IN SRS`

### 7.3 Community feed boundary
Required by SRS §4.7:
- Each university community shall provide a feed containing relevant community activity.
- Feed may contain posts, discussions, reviews, Q&A activity, and community interactions.

Not required by SRS for Phase 2:
- implementing actual post creation, Q&A, voting, ratings, or messaging systems
- using the feed as a full product backend for Phase 3+ features

Phase 2 implementation should therefore establish:
- a feed endpoint
- a feed view
- visibility filtering according to access state
- safe integration points for future content feeds

### 7.4 Authorization model
The plan preserves the authorization model from Phase 1:
- Guest
- Authenticated unverified user
- Verified user
- Admin

Server-side authorization must derive from current DB-backed user state and membership state. It must never trust:
- frontend role
- frontend verificationStatus
- client-provided community membership
- stale JWT role/verification claims

## 8. Security and validation plan

### Required security checks
- route access must be server-authoritative
- IDOR prevention for `/u/:slug` and `/profile/:username`
- slug and username validation before persistence
- reserved username rejection
- public resource access checks for guests and authenticated users
- admin-only resource checks
- no route security assumptions based solely on frontend rendering

### Required tests
- unit tests for slug/username validators
- API tests for public and protected resource access
- authorization matrix tests
- database uniqueness tests
- route tests for invalid slugs/usernames
- integration tests for guest/unverified/verified/admin access

## 9. SRS ambiguities affecting implementation

The following items are not fully specified in the SRS and must be explicitly flagged rather than assumed:
- exact reserved username list — `NOT SPECIFIED IN SRS`
- profile editing behavior — `NOT SPECIFIED IN SRS`
- profile privacy settings — `NOT SPECIFIED IN SRS`
- university creation workflow — `NOT SPECIFIED IN SRS`
- university approval/management workflow — `NOT SPECIFIED IN SRS`
- exact membership approval process — `NOT SPECIFIED IN SRS`
- exact community feed schema — `NOT SPECIFIED IN SRS`
- exact role/verification mechanics for university/community actions beyond the access-state split — `NOT SPECIFIED IN SRS`

## 10. Phase 2/Phase 3 boundary summary

Phase 2 implements the community identity and profile foundation only. It does not implement:
- standalone discussion posts
- reviews and ratings
- Q&A answer flows
- voting
- following
- notifications
- private messaging
- admin moderation dashboard

All of those remain out of scope for this plan and are deferred to later phases.

## 11. Implementation readiness gate

The plan is ready for execution only when all tasks above are validated against the SRS and no task introduces later-phase functionality. This plan preserves the existing Phase 1 architecture and explicitly avoids the outdated custom auth/session, Cloudinary, and custom OAuth patterns.
