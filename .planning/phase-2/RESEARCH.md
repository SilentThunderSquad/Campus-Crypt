# Phase 2 Research

## 1. Phase 2 SRS requirements

This research pass is based on the repository-root SRS and is intended to define the requirements boundary for Phase 2 only. The SRS defines the following Phase 2-aligned scope:

### 1.1 University community system (SRS §4.5)

The platform shall provide university-specific communities. Each university community shall have:
- unique identity
- unique URL slug
- university information
- community feed
- discussions
- ratings
- Q&A
- member information

Example route pattern:
- `https://domain.com/u/{slug}`

Required SRS characteristics:
- university/community identity must be unique
- URL slugs must be unique and URL-safe
- community pages are part of the public product surface

### 1.2 User profiles (SRS §4.6)

Users shall have public profile pages. Example route pattern:
- `https://domain.com/profile/{username}`

User profile requirements:
- unique usernames
- reserved keywords restricted
- usernames must be URL-safe
- public profile representation
- shareable URLs
- user information
- community activity where permitted
- following information

### 1.3 Community feed (SRS §4.7)

Each university community shall provide a feed containing relevant community activity. The feed may contain:
- posts
- discussions
- reviews
- Q&A activity
- community interactions

Access to interactions shall follow the authentication and verification rules.

### 1.4 Access and verification boundaries (SRS §3 and §4.2)

The SRS makes these access rules explicit:
- Guests may browse public university content
- Authenticated, unverified users may browse and reply in existing discussions but not create standalone discussion posts
- Verified users may join communities, create posts, comment, vote, rate universities, answer Q&A, follow users, send messages, and use verified-only community interactions
- Admins have platform moderation and management privileges

This feeds the Phase 2 authorization model for university communities and profile visibility.

## 2. Planning conflict check

No direct SRS/GSD conflict was identified in the current planning metadata. The existing Roadmap Phase 2 description is directionally consistent with the SRS, but it is not exhaustive. The SRS is the authoritative source and expands the required scope beyond the short roadmap summary.

## 3. Existing architecture dependencies

Phase 1 already establishes the required foundation that Phase 2 should build upon:
- Supabase Auth for authentication and session identity
- Express backend for route and authorization enforcement
- Prisma/PostgreSQL for persistent application data
- `User` model with `role`, `verificationStatus`, `supabaseUserId`, and auth identity tracking
- backend-authoritative authorization model
- client/server split with Vite + React frontend and Express backend

Current model support already present in the repo:
- `User` model: user identity, email, name, `role`, `verificationStatus`, auth provider metadata, login timestamps
- `AuthIdentity` model: provider identity mapping
- `Session` model: session lifecycle and expiry data
- `AuditLog` model: logging capability

These are the foundation blocks for Phase 2; they do not yet include university/community/profile entities.

## 4. Requirements traceability

| SRS requirement | Phase 2 capability | Proposed implementation area | Database model/data requirement | API requirement | Frontend requirement | Authorization requirement | Verification/acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| University communities must exist as unique, URL-addressable entities | University/community landing pages and community identity | `server/src/services/universityService.js`, `server/src/routes/universities.js`, `client/src/pages/university/*` | `University` + `Community`-style records with unique slug and member metadata | GET/POST for community info and membership status | University page, community header, public landing page | Guest can view public info; verified users can join/access community features; admin can manage | Slug uniqueness, route loads, membership access enforced |
| each university community has a feed | Community feed surface for university activity | `server/src/routes/communityFeed.js`, `client/src/pages/community/*` | Feed items aggregated from community-related entities | GET feed endpoint with filtering | Feed rendering and empty-state UX | Users can view permitted content; content access follows verification rules | Feed shows approved community content only |
| users have public profile pages | public profile page and URL routing | `server/src/routes/users.js`, `client/src/pages/profile/*` | `UserProfile` metadata or canonical user record with URL-safe username | GET profile endpoint and profile visibility lookup | Profile page layout and follow status UI | Public profile visibility must be server-enforced | URL resolves to correct user and follows privacy rules |
| unique usernames/URL-safe usernames | identity and slug validation rules | `server/src/validators/profileValidators.js`, shared validation | unique username/slug constraints | profile creation/update API validation | validation messaging and uniqueness feedback | server rejects duplicates/reserved names | duplicate and invalid usernames are blocked |
| community member information | membership model and membership access | `server/src/services/membershipService.js` | `UniversityMembership`/`CommunityMember` relationship | join/leave/status endpoints | join button and member state | only verified users can join/participate based on access rules | membership state is persisted and enforced |
| access rules vary by auth/verification state | authorization matrix for profile/community access | route guards and server-side permission checks | membership/admin/verification fields on user or relation tables | protected endpoints with role/verification gating | UI shows correct actions | backend authoritative, no client-only auth | guest/unverified/verified/admin states behave correctly |
| community activity may include posts/discussions/reviews/Q&A | Phase 2 feed boundary and integration hooks | `server/src/services/activityService.js`, `client/src/pages/community/` | feed aggregation model or relation tables | feed and activity endpoints | feed cards and sections | only allowed content appears for a given access level | feed respects visibility and authorization |
| incoming content contributions belong to a university/community | university-scoped content ownership | content service layer and route design | content tables reference community and author | create/update/delete permissions | content forms scoped to university | only eligible users can create certain content types | content is anchored to a university and author |

## 5. Research findings on required data model

The SRS does not define a fully normalized schema, but it does establish the required semantics for Phase 2 entities. The following is a proposed model only and must remain a planning artifact; it is not a schema change decision.

### 5.1 `University` / `Community`

Required fields (inferred from SRS):
- `id`
- `name`
- `slug` (unique, URL-safe)
- `description`
- `website` or canonical public URL (if provided)
- `location` or region metadata
- `createdAt`
- `updatedAt`
- status flags for visibility or moderation (if required by admin workflow)

Constraints:
- unique slug constraint
- URL-safe slug validation (lowercase, trimmed, ASCII-safe or normalized slug rules)
- ownership or admin management relationship to an admin user or role

Relationships:
- one-to-many with community posts/discussions/reviews/Q&A content
- one-to-many with membership records
- optional relation to profile/public pages / cover image metadata

Visibility requirements:
- public browsing is allowed for guests
- content access follows auth/verification rules

### 5.2 `UserProfile`

This can be represented as a profile extension of the existing `User` model or a separate profile table. The SRS requires public representation of a user and a stable URL, so a profile identity layer is required.

Required fields (inferred):
- `userId`
- `username` (unique, URL-safe)
- `displayName`
- `bio`
- `school` or university affiliation metadata (if applicable)
- `avatarUrl` / profile image reference
- `isPublic` or profile visibility settings (if product requires privacy toggles)
- `createdAt`
- `updatedAt`

Constraints:
- username uniqueness
- reserved keyword restrictions
- normalized username rules

Relationships:
- one-to-one with `User`
- follower/following relationships for later social features

Not specified in SRS:
- whether profile visibility is always public or configurable per user
- whether profile activity is public by default in all cases

### 5.3 `CommunityMember` / `UniversityMembership`

Required semantics:
- membership ties a `User` to a university/community
- membership must be subject to verification/access rules
- membership state is needed for allowing university participation and feed access

Required fields:
- `id`
- `userId`
- `communityId` or `universityId`
- `status` such as active/member/banned/pending
- `joinedAt`
- `updatedAt`

Constraints:
- unique user-to-community membership
- ensure no duplicate active memberships

Visibility requirements:
- public member listing may be allowed, but membership visibility itself is not fully specified

### 5.4 Feed and content indexability

The SRS indicates a community feed may include multiple content categories but does not mandate a single feed table in Phase 2. The feed is likely best treated as a query layer or aggregation view rather than a single content table in the initial Phase 2 implementation.

### 5.5 Not specified in SRS

The SRS does not explicitly define:
- whether universities are pre-seeded or admin-created
- whether the platform allows multiple community types beyond university communities
- whether community pages are institution-only or support student groups as a subset
- how verification is granted for university membership
- exact profile privacy defaults
- exact reserved-word list for usernames

These remain open questions for detailed planning and should not be treated as implemented requirements.

## 6. Proposed API surface

This is a Phase 2 proposal only, not an implementation. The API should be grounded in existing backend patterns and current Phase 1 auth middleware.

### 6.1 University/community endpoints
- `GET /api/universities` — list public universities/communities
- `GET /api/universities/:slug` — fetch university/community details
- `POST /api/universities/:slug/join` — verified users join community
- `POST /api/universities/:slug/leave` — leave membership
- `GET /api/universities/:slug/members` — member listing, if public or admin-scoped
- `GET /api/universities/:slug/feed` — community feed information

### 6.2 Profile endpoints
- `GET /api/users/:username` — public profile fetch
- `GET /api/users/me/profile` — authenticated profile view/edit context
- `PATCH /api/users/me/profile` — update profile metadata
- `GET /api/users/:username/followers` — follower list
- `GET /api/users/:username/following` — following list

### 6.3 Membership endpoints
- `GET /api/users/me/memberships` — current user memberships
- `GET /api/universities/:slug/membership-status` — check access and join status

### 6.4 Validation and integrity rules
- slug uniqueness checks
- username uniqueness checks
- reserved-word guard
- permission checks based on `User.role` and `User.verificationStatus`
- server-enforced access gating for profile and community resources

## 7. Frontend/routing proposal

### 7.1 Route structure
- `/u/:slug` — university/community page
- `/u/:slug/feed` — community feed view
- `/u/:slug/members` — member listing
- `/profile/:username` — public profile page
- `/me/profile` — authenticated own profile management route

### 7.2 Routing constraints
- URLs must be stable and unique
- invalid/unknown slugs should resolve safely with not-found handling
- unauthorized pages must be blocked on the server and should not leak private resource details
- public vs protected pages must be handled separately

### 7.3 UX requirements implied by SRS
- guest users can browse public community pages
- unauthenticated users should not see verified-only actions
- verified users should see join/create action affordances
- admin toggles and management controls should be route-aware but server-authoritative

## 8. Authorization matrix for Phase 2

The following matrix is derived directly from the SRS and the existing authorization model already established in Phase 1.

| Action | Guest | Authenticated unverified | Verified user | Admin |
| --- | --- | --- | --- | --- |
| View public university/community page | Can view | Can view | Can view | Can view |
| Join a university/community | Cannot | Cannot | Can join (if permitted by community rule) | Can manage |
| Access protected community functionality | Cannot | Limited to public browsing; not privileged community actions | Can access verified-only community actions | Can manage |
| Create standalone discussion post | Cannot | Cannot | Can create | Can manage |
| Comment/reply in existing discussion | Public-read behavior only | Can reply in existing discussions | Can participate | Can moderate |
| View public profile page | Can view public user representation | Can view public profile representation | Can view public profile representation | Can view public profile representation |
| Edit own profile | Cannot | Cannot unless authenticated profile edit is implemented and permitted | Can edit own profile | Can manage user profiles |
| Follow/unfollow | Cannot | Can follow/unfollow if feature is enabled and permitted by product rules | Can follow/unfollow | Can manage social state |
| Access member or admin-only community management | Cannot | Cannot | Usually no; requires explicit permission | Can manage |
| View admin-only moderation or logs | Cannot | Cannot | Cannot | Can view |

Important boundary:
- the SRS distinguishes auth from verification; no action is granted solely because a request carries a user identity.
- server-side DB-backed authorization remains authoritative for all community/profile actions.

## 9. Phase 2 / Phase 3 boundary

The SRS explicitly places the following in later phases, beyond Phase 2:
- posts (Phase 3)
- ratings (Phase 3)
- Q&A (Phase 4)
- voting (Phase 4)
- follow system (Phase 4)
- notifications (Phase 4)
- private messaging (Phase 5)
- moderation dashboards / admin-only content management (Phase 6)

Phase 2, as the SRS describes it, is therefore the university/community and profile foundation layer only. It should establish:
- community identity and URL structure
- public university pages
- profile pages and username routing
- join/access and membership state
- feed container for community activity
- permission boundaries for guest vs verified vs admin access

Phase 2 should not implement the actual content and interaction systems that belong to Phase 3+.

This means the Phase 2 feed must remain a minimal community activity surface, not a full replacement for Phase 3 product functionality.

## 10. Security considerations

### 10.1 Profile visibility
- profile pages must not leak private data to unauthorized users
- profile access should be server-enforced against auth state and explicit visibility rules

### 10.2 University membership and access
- membership should be checked against current database state, not JWT claims
- only verified users should be permitted to gain community participation access if the product requires it
- admin-only management endpoints must remain protected

### 10.3 IDOR prevention
- community IDs and profile IDs must not be guessable as a bypass mechanism
- route access must validate the user, the resource, and the permission state on the server

### 10.4 User enumeration and privacy concerns
- profile lookup behavior must avoid revealing private existence checks to unauthenticated callers unless explicitly required by the product
- username uniqueness checks must be validated server-side without exposing internal data

### 10.5 Slug/resource authorization
- slug uniqueness and reserved-keyword checks must be server-enforced
- unauthorized access to community or profile routes should produce safe not-found or denied responses rather than leaking internal details

### 10.6 Backend authority
- frontend route gating is not a security boundary
- role and verification checks must be resolved from the current Campus Crypt database record and not from client-controlled fields or stale JWT metadata

## 11. Implementation risks

1. Scope drift from the SRS
   - The roadmap summary is short; if the implementation treats Phase 2 as a full social app, it will exceed the SRS boundary.

2. Data model ambiguity
   - The SRS does not specify whether university/community and user profile logic should be a single or split schema design.

3. Access semantics ambiguity
   - The SRS defines the access states but does not fully define every action for every community or profile type.

4. Feed boundary ambiguity
   - “community feed” may be interpreted too broadly; it should be bounded to community activity and not absorb Phase 3 feature implementation.

5. Profile privacy ambiguity
   - The SRS requires public profile pages but does not fully specify profile privacy defaults, editing permissions, or visibility controls.

6. Verification semantics
   - The SRS differentiates authentication and verification but does not define the exact verification lifecycle for university communities or profile access beyond a verified-user distinction.

## 12. Verification and acceptance criteria

Phase 2 should be considered ready for detailed planning only when the following are true:
- the required Phase 2 scope is limited to university communities and public profile foundation
- the SRS requirements are mapped to a clear technical boundary
- university/community URLs and profile URLs are uniquely and safely routable
- membership and access rules are server-authoritative
- the feed remains limited to community activity and does not absorb Phase 3 features
- authorization states are correctly distinguished: guest, authenticated unverified, verified, admin
- open SRS ambiguities are tracked rather than silently assumed

## 13. Open questions / SRS ambiguities

The following items are not fully specified by the SRS and should be raised during detailed implementation planning, without inventing requirements:
- exact verification criteria for “verified” university/community access
- whether university community membership is open, request-based, or admin-managed
- whether profile visibility is fixed-public or user-configurable
- whether usernames must be globally unique on all users or only within community contexts
- whether the community feed is a generic event stream or a list of a specific subset of community content
- exact reserved-word list for usernames and slugs
- whether universities are seeded or admin-created in the product lifecycle

## 14. Research conclusion

Phase 2 is correctly scoped as the university/community and public profile foundation layer. The SRS supports the feature set, and the repo already has the required foundation from Phase 1 (Supabase Auth, Prisma/PostgreSQL, backend auth middleware, authorization state model, and client/server structure). The main planning requirement is to preserve the strict Phase 2 boundary and avoid drifting into Phase 3+ social/features work.

The Phase 2 research outcome is therefore: define the university/community identity, membership, slug routing, and public profile foundation as the Phase 2 boundary, and keep all discussion, ratings, Q&A, voting, messaging, notifications, and moderation work out of scope until later phases.
