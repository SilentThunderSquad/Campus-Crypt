# Architecture

## High-level system shape
The repository is structured as a monorepo-style application with three major conceptual buckets:
- `client/` for the user-facing web app
- `server/` for backend logic and API services
- `shared/` for cross-cutting domain and validation code

## Current runtime state
The application is in a partial Phase 1 state: the repo contains an early scaffold and some authentication-related experimentation, but the authoritative direction is now the final SRS-aligned architecture. The codebase is not yet fully aligned to the Supabase-based final design and should be treated as a legacy implementation base pending corrective Phase 1 work.

## Final architecture direction
The product requirements and updated SRS point toward a layered web application with managed infrastructure:
1. Frontend web app
   - route-driven pages
   - auth-aware UI states
   - community, profile, and messaging screens
2. API layer
   - Express endpoints for auth, profile, and future product features
   - backend security and authorization enforcement
3. Business services
   - user identity mapping, verification checks, moderation hooks, notifications, and security logic
4. Data layer
   - Supabase PostgreSQL with Prisma ORM
5. Identity and session layer
   - Supabase Auth with Google OAuth through Supabase Auth
6. Storage layer
   - Supabase Storage
7. Realtime layer
   - Socket.io
8. Security layer
   - backend-driven access control, current database-backed authorization, rate limiting, secure cookies, logging, and validation

## Architectural responsibilities
- Supabase Auth provides the authenticated user identity and session infrastructure.
- The Express backend is the authoritative source for application authorization.
- Role and verificationStatus must be resolved from the current Campus Crypt database state instead of stale JWT claims.
- The client remains a UX layer and cannot be trusted as the source of authorization truth.

## Architectural strengths
- Clear separation between client and server folders
- Feature boundaries are already implied by the scaffold naming (`config`, `routes`, `services`, `middleware`, `utils`)
- The final architecture aligns with the SRS and the managed infrastructure model required for deployment

## Architectural gaps
- Legacy custom-auth or JWT-first assumptions still need to be removed from planning and implementation work.
- The repository still contains stale auth/session artifacts from the previous architecture that need to be cleaned up during corrective implementation.
- The final Supabase/Auth integration and database mapping have not yet been applied in the actual production implementation path.

## Design direction
This codebase should evolve toward a layered architecture with strict responsibility boundaries: UI concerns in client, business logic in services, persistence in Prisma and Supabase PostgreSQL, identity and session in Supabase Auth, and authorization in backend middleware driven by current database state.
