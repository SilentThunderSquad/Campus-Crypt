# Campus Crypt --- Phase 1 Research

## 1. Phase Intent

Phase 1 establishes the secure identity and authorization foundation for Campus Crypt under the final SRS architecture: Supabase Auth for authentication and session infrastructure, Supabase PostgreSQL with Prisma for persistent application data, and a backend authorization layer that enforces the current database-backed role and verification state.

The foundation must preserve the trust boundaries defined by the SRS:

- Guest
- Authenticated unverified user
- Authenticated verified user
- Admin

Phase 1 remains a foundation phase. It is not a product-delivery phase for university communities, ratings, Q&A, messaging, or moderation.

------------------------------------------------------------------------

## 2. Source Requirements

The updated SRS defines the final architecture and scope:

### Authentication

- Social-login-only authentication
- Google OAuth through Supabase Auth
- Supabase Auth provides the authentication and session infrastructure
- Campus Crypt backend remains authoritative for application authorization
- Protected-route session validation
- Session expiration, invalidation, and re-authentication flows
- Logged-in users must not access login/signup pages
- Guests attempting protected routes must be redirected to login and the requested URL preserved

### MFA / passkey readiness

- Authenticator apps and passkeys are supported by Supabase Auth where applicable
- OTP remains future scope
- MFA state must be extensible without redesigning the core identity model

### Authorization

The SRS requires backend authorization based on the current user state from the application database. The backend must answer:

- Who is authenticated?
- What permissions does this application user actually have?

The frontend is UX-only and must never be trusted as an authorization layer.

### Technical Direction

Frontend:

- React + Vite + TypeScript
- Tailwind CSS
- React Router DOM
- TanStack Query
- Zustand

Backend:

- Node.js + Express.js + TypeScript

Database and data layer:

- Supabase PostgreSQL
- Prisma ORM

Authentication and session layer:

- Supabase Auth
- Google OAuth via Supabase Auth

Storage:

- Supabase Storage

Realtime:

- Socket.io

Deployment:

- Vercel
- Railway / Render
- Supabase

### Security Requirements

The SRS calls for:

- secure session management
- passwordless authentication
- MFA and passkey readiness
- route protection middleware
- CSRF protection
- rate limiting
- request validation
- secure cookie handling
- activity and security logging
- input sanitization
- XSS and SQL injection prevention

------------------------------------------------------------------------

## 3. Final Architecture Decision

The final architecture is deliberately not a custom JWT auth system.

- Supabase Auth is the authentication and session infrastructure.
- Google OAuth is configured through Supabase Auth.
- Supabase PostgreSQL is the managed database layer.
- Prisma is the application ORM used over the managed PostgreSQL instance.
- Campus Crypt backend resolves the authenticated user and then looks up the current application record, role, and verificationStatus from the database.
- Authorization decisions use current DB state, not stale claims embedded in a JWT.
- Supabase Storage replaces Cloudinary in the final architecture.
- Socket.io remains the realtime layer for application-level messaging.

This architecture is the authoritative planning basis for Phase 1 corrective work.

------------------------------------------------------------------------

## 4. Authorization Boundary

Supabase Auth answers:

- Who is the authenticated user?

The Campus Crypt backend answers:

- What is this user allowed to do?

The correct flow is:

1. Validate JWT signature and expiry.
2. Resolve the sessionId and verify that the database-backed session is active and not expired or revoked.
3. Resolve the current application user from persistent storage.
4. Resolve the current role and verificationStatus from the database.
5. Enforce permissions in backend middleware.

The API must not trust JWT role or verification claims as the final authority.

------------------------------------------------------------------------

## 5. Phase 1 Objectives

Phase 1 should establish the following foundation:

1. Supabase project and database configuration
2. Prisma connection to Supabase PostgreSQL
3. Application user identity mapping to Supabase Auth identity
4. Google OAuth via Supabase Auth
5. Authentication and session integration between Supabase Auth and Express
6. Backend authentication middleware
7. Backend authorization middleware
8. Guest/unverified/verified/admin access model
9. Client authentication state and protected-route UX
10. Security baseline
11. MFA/passkey architectural readiness
12. Test and verification strategy

------------------------------------------------------------------------

## 6. Out-of-Scope Items for Phase 1

Do not implement the following during Phase 1:

- university communities
- profiles beyond the authentication identity foundation
- posts
- ratings
- Q&A
- voting
- notifications
- following
- messaging
- moderation dashboard

These remain reserved for later roadmap phases.

------------------------------------------------------------------------

## 7. Legacy Risks to Remove

### Risk 1: custom auth duplication

If a custom Google OAuth callback or custom JWT issuance flow is kept, the repository will have two competing identity systems.

Mitigation: use Supabase Auth as the single identity and session layer.

### Risk 2: stale authorization metadata

If JWT role or verification claims are treated as authoritative, the app can grant access based on stale values.

Mitigation: always resolve the current user and permission state from the database before authorizing an action.

### Risk 3: Cloudinary dependency drift

Cloudinary is not part of the final architecture.

Mitigation: remove it from planning and implementation scope and use Supabase Storage instead.

### Risk 4: old session assumptions

A custom in-memory session model is not the final architecture.

Mitigation: rely on managed session infrastructure from Supabase Auth and persistent DB-backed user/session records where relevant.

------------------------------------------------------------------------

## 8. Migration Considerations

The repository already contains early scaffolding and some legacy auth/session experiments. The Phase 1 corrective work should therefore:

- preserve reusable client/server structure and TypeScript setup
- remove dated assumptions from planning and implementation scope
- align any auth middleware to Supabase Auth integration
- preserve backend authorization concepts while replacing the old source-of-truth model
- avoid a broad rewrite; fix the architecture at the edge where the current implementation conflicts with the SRS

------------------------------------------------------------------------

## 9. Phase 1 Research Conclusion

The correct Phase 1 priority is the trust layer under the final SRS architecture:

1. Supabase project and environment setup
2. Prisma + Supabase PostgreSQL connection
3. User identity mapping to Supabase Auth
4. Google OAuth through Supabase Auth
5. Express integration with the authenticated Supabase identity
6. Backend authorization using current database state
7. Client auth state and protected-route UX
8. Security baseline and MFA/passkey readiness
9. Automated verification of auth and authorization boundaries

The phase should finish with clear evidence that guest, unverified, verified, and admin boundaries are enforced server-side without relying on stale JWT claims or a second custom auth system.
