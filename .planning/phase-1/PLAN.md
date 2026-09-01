# Campus Crypt --- Phase 1 Implementation Plan

## Phase 1: Supabase-based foundation and identity

### Phase Goal

Establish a secure, role-aware application foundation for Campus Crypt under the updated SRS architecture, using Supabase Auth as the authentication/session layer and Campus Crypt backend authorization as the source of truth for access decisions.

------------------------------------------------------------------------

# 1. Non-Negotiable Rules

Before executing any task:

1. Preserve the existing repository structure unless a concrete implementation need requires a change.
2. Do not rewrite working code merely to match a preferred architecture.
3. Inspect a file before modifying it.
4. Do not introduce a second custom authentication provider or a second custom JWT/session system when Supabase Auth already provides the required identity/session layer.
5. Do not introduce password/email authentication. The SRS specifies social-login-only authentication.
6. Do not make frontend authorization the source of truth.
7. Backend authorization must enforce every protected permission.
8. Do not implement future-scope OTP or other Phase 2 functionality during Phase 1.
9. Do not implement Phase 2+ product features during Phase 1.
10. Do not expose secrets, OAuth credentials, database credentials, session tokens, or private keys in source control or logs.
11. Keep `.env.example` safe and free of real credentials.
12. Prefer small, verifiable changes over a large rewrite.

------------------------------------------------------------------------

# 2. Phase Success Criteria

Phase 1 is complete only when all of the following are true:

- Client and server can run using the repository's intended scripts.
- Environment configuration is documented.
- Supabase PostgreSQL + Prisma foundation validates successfully.
- User identity schema exists and maps to Supabase Auth identity.
- Authentication and verification states are represented correctly.
- Google OAuth through Supabase Auth works.
- Secure authenticated session integration is working according to the selected architecture.
- Server-side authentication middleware works.
- Server-side verified-user authorization works.
- Server-side admin authorization works.
- Client authentication state works.
- Logged-in users are redirected away from login/signup pages.
- Guests attempting protected routes are redirected to login.
- Requested protected URL can be preserved for post-login redirect.
- Invalid/expired/revoked sessions fail safely.
- MFA/passkey architecture remains extensible without redesigning the core identity model.
- Authentication and authorization smoke tests pass.
- Security-sensitive errors do not leak secrets or internal details.

------------------------------------------------------------------------

# 3. Scope

## In Scope

- Repository baseline
- Environment contract
- Client/server configuration
- Supabase project and database configuration
- Prisma connection to Supabase PostgreSQL
- User model and application-user-to-Supabase-user mapping
- Google OAuth integration via Supabase Auth
- Authentication middleware for Supabase identity resolution
- Backend authorization middleware driven by current database state
- Guest/unverified/verified/admin model
- Client auth state and protected-route UX
- Security baseline around authentication
- MFA/passkey-ready architecture
- Authentication/authorization smoke tests
- Documentation of the Phase 1 architecture boundaries

## Out of Scope

- University communities
- Posts
- Ratings
- Voting
- Q&A features
- Notifications
- Following
- Messaging
- Moderation dashboard
- Cloudinary upload flows
- Full admin dashboard
- Maintenance-mode feature implementation
- Deployment production hardening beyond the baseline
- OTP MFA implementation
- Advanced analytics

------------------------------------------------------------------------

# 4. Identity and Authorization Model

Do not model authorization as only `isVerified`.

The system must distinguish:

### Guest

Not authenticated.

Can:
- access public content

Cannot:
- access protected routes
- perform verified-only interactions

### Authenticated + Unverified

Can:
- browse content
- perform non-verified public interactions allowed by the product rules

Cannot:
- access verified-only product actions
- perform admin-only actions

### Authenticated + Verified

Can:
- perform verified user actions
- access verified participation features

### Admin

Administrative privileges must be represented separately from ordinary verification.

Admins can:
- moderate content
- manage users and communities
- control maintenance mode
- access security and activity logs
- restrict or ban malicious users

The exact enum/model naming may follow repository conventions, but the semantic separation must remain.

------------------------------------------------------------------------

# 5. Architectural Boundaries

## Frontend

Responsible for:

- authentication UI
- session-aware UI state
- route-level UX redirects
- loading and error state handling
- user-facing verification state

The frontend must never be treated as the authoritative authorization layer.

## Backend

Responsible for:

- Supabase Auth identity verification and session resolution
- application-user lookup and authorization state resolution
- current role and verificationStatus lookup from the database
- backend route guards and permission enforcement
- security-sensitive operations
- protected API access

## Database and data layer

Responsible for:

- persistent application records
- role and verification state
- restriction and admin state
- user/session metadata needed for security enforcement

The application database is the source of current authorization truth.

## Storage

- Supabase Storage is the file/media storage mechanism.
- Cloudinary is not part of the final architecture for this project.

## Realtime

- Socket.io remains the application-level realtime layer for later features.

------------------------------------------------------------------------

# 6. Required Authentication Flow

The final architecture relies on the following flow:

1. Supabase Auth authenticates the user and provides identity/session data.
2. The Express backend verifies the authenticated Supabase identity and resolves the Campus Crypt application user.
3. The backend checks the current database-backed user, role, restrictions, and verificationStatus.
4. The backend authorizes the request.
5. The client receives guidance only through responses and UX state; it never decides access control.

This flow must be documented in implementation and protected-route logic.

------------------------------------------------------------------------

# 7. Task 1 --- Supabase Project and Environment Contract

## Objective

Establish the managed infrastructure baseline for the final architecture.

## Work

- configure the Supabase project metadata required for the application
- define environment variables for Supabase, PostgreSQL, and Google OAuth
- document the client/server API origin contract
- document cookie and CORS policy
- ensure no real credentials are committed to source control

## Acceptance

- environment variables are documented and safe
- Supabase and PostgreSQL configuration is represented clearly
- no real secrets are committed

------------------------------------------------------------------------

# 8. Task 2 --- Prisma and Supabase PostgreSQL Foundation

## Objective

Create the minimum database foundation required for authentication and authorization.

## Work

- connect Prisma to the Supabase-managed PostgreSQL instance
- define the minimal user, session, and authorization model required by the SRS
- include support for role, verificationStatus, and restriction data
- preserve extensibility for future MFA/passkey support

## Acceptance

- Prisma schema validates
- Prisma client initializes successfully
- user identity and role/verification model remain consistent
- the DB supports persistent authorization state

------------------------------------------------------------------------

# 9. Task 3 --- User Identity Mapping to Supabase Auth

## Objective

Map the application user records to the authenticated Supabase identity.

## Work

- define how the Campus Crypt user record is linked to the Supabase-authenticated identity
- handle first-login and existing-user flow correctly
- maintain a stable application user record for role and verification state
- ensure account restrictions and admin status are resolved from current database state

## Acceptance

- the application user and Supabase identity can be resolved together
- no custom auth provider is required in parallel with Supabase Auth
- identity mapping is consistent and auditable

------------------------------------------------------------------------

# 10. Task 4 --- Google OAuth via Supabase Auth

## Objective

Implement Google OAuth through Supabase Auth instead of a custom Google OAuth callback.

## Work

- configure the Google OAuth provider in the Supabase project
- set up client-to-Supabase login flow as the identity entry point
- ensure the Express backend resolves the authenticated identity securely
- keep demo auth development-only and disabled outside development

## Acceptance

- Google login works through Supabase Auth
- OAuth errors fail safely
- no credentials are exposed in logs or source control

------------------------------------------------------------------------

# 11. Task 5 --- Express Session and Authentication Integration

## Objective

Integrate Supabase-authenticated identity into the Express backend without creating a second auth system.

## Work

- resolve authenticated session identity in Express middleware
- validate the authenticated token/session using the correct infrastructure path
- resolve the application user from the database
- ensure session expiration and invalidation are respected

## Acceptance

- authenticated requests resolve to the correct user
- invalid and expired sessions fail safely
- unauthorized access is rejected before business logic executes

------------------------------------------------------------------------

# 12. Task 6 --- Backend Authorization Middleware

## Objective

Make the backend the authoritative permission layer.

## Work

- implement `requireAuth`
- implement `requireVerifiedUser`
- implement `requireAdmin`
- resolve role and verificationStatus from the database on each request rather than trusting JWT claims
- distinguish guest, unverified, verified, and admin states cleanly

## Acceptance

- guest requests are rejected for protected routes
- unverified users are denied verified-only actions
- verified users can pass verified checks
- admins can pass admin checks
- authorization cannot be bypassed by altering frontend state

------------------------------------------------------------------------

# 13. Task 7 --- Client Authentication State and Protected-Route UX

## Objective

Provide the minimum client-side UX required for the final auth flow without making the client authoritative.

## Work

- show login state and loading/error states
- redirect authenticated users away from login/signup screens
- redirect guests to login while preserving the requested URL
- protect routes by response and UX logic only, not by trust in client-side state

## Acceptance

- guest to protected route redirects as expected
- authenticated user to auth page redirects away from that screen
- protected-route UX remains consistent with backend policy

------------------------------------------------------------------------

# 14. Task 8 --- MFA and Passkey Readiness

## Objective

Prepare the identity architecture for SRS-required MFA/passkey capabilities without implementing the full future feature set.

## Work

- keep user/session structure extensible for passkeys and authenticator-based MFA
- document extension points for future MFA enablement and sensitive actions
- avoid fake or misleading MFA implementation

## Acceptance

- the architecture supports future MFA and passkey integration
- no insecure fake MFA is described as complete MFA

------------------------------------------------------------------------

# 15. Task 9 --- Security Baseline

## Objective

Establish the reusable security boundaries required by the SRS.

## Work

- secure cookie configuration
- CSRF strategy for state-changing requests
- request validation
- rate limiting around auth endpoints
- safe error handling
- security logging
- input sanitization and XSS prevention boundaries

## Acceptance

- authentication endpoints have clear rate-limit boundaries
- invalid input is rejected safely
- errors do not reveal secrets
- session/cookie handling follows secure defaults

------------------------------------------------------------------------

# 16. Task 10 --- Tests and Verification

## Automated Tests

Cover:

### Authentication

- valid session
- missing session
- invalid session
- expired session
- revoked session
- logout behavior

### Authorization

- guest vs authenticated
- unverified vs verified
- non-admin vs admin

### Routing

- guest protected-route redirect
- requested URL preservation
- authenticated-user login-page redirect

### Configuration

- environment variable presence and placeholder values
- Prisma validation and client generation
- server build output

## Verification Strategy

- server build check
- Prisma validation and generation check
- auth middleware test suite
- protected-route route guard tests
- guest/unverified/verified/admin authorization tests
- security smoke checks for invalid/expired sessions

## Acceptance

- targeted auth tests pass or are clearly blocked by missing provider config and documented as such
- no test claims real OAuth or DB-backed auth without valid configuration

------------------------------------------------------------------------

# 17. Environment Variable Requirements

The environment contract for the final architecture must include:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET` only if a compatibility layer requires it; the application must not treat JWT claims as authoritative for authorization
- `CLIENT_URL`
- `SERVER_PORT`
- `NODE_ENV`

All example files must use placeholders and never include real credentials.

------------------------------------------------------------------------

# 18. Migration Considerations from the Current Scaffold

The current repository contains early authentication and session scaffolding that should not be blindly preserved. The Phase 1 corrective implementation should:

- preserve reusable client/server structure and TypeScript configuration
- remove custom Google OAuth callback assumptions from the plan and implementation scope
- remove custom JWT issuance as the primary architecture design
- replace stale in-memory auth/session assumptions with Supabase Auth and database-backed authorization
- keep the application authorization layer server-side and DB-driven
- remove Cloudinary from the architecture and storage plan

------------------------------------------------------------------------

# 19. Phase 1 Acceptance Criteria

The Phase 1 foundation is accepted only when:

- Supabase Auth is the identity/session provider
- Prisma connects to Supabase PostgreSQL
- Google OAuth is wired through Supabase Auth
- the backend resolves the authenticated identity and current database-backed authorization state correctly
- guest/unverified/verified/admin checks are enforced server-side
- protected-route UX follows the backend decisions
- the project remains within the Phase 1 scope and does not start Phase 2 product work

------------------------------------------------------------------------

# 20. Final Planning Note

This Phase 1 plan reflects the final SRS architecture and deliberately supersedes earlier custom-auth, custom-JWT, and Cloudinary assumptions. It is the correct implementation basis for the corrective Phase 1 work.
