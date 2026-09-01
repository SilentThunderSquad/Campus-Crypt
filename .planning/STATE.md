# Project State

## Current status
Phase 1 has been completed and validated against the final SRS architecture. The repository is aligned to the final architecture defined by the SRS: Supabase Auth, Supabase PostgreSQL, Prisma, Supabase Storage, and backend-authoritative application authorization.

The current Phase 1 scope is complete, including environment setup, Prisma migration alignment, auth/user lifecycle validation, MFA/passkey readiness, security baseline, and the final Task 10 verification gates.

## Scope snapshot
This project focuses on a secure, verified university community and review platform with discussion, ratings, Q&A, following, messaging, administration, and platform maintenance features. The Phase 1 scope remains limited to the identity, authentication, session, and authorization foundation required before those higher-order product features are implemented.

## Source documents
- `Campus Crypt - SRS.md`
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/phase-1/RESEARCH.md`
- `.planning/phase-1/PLAN.md`

## Current facts
- The authoritative product architecture is now defined around React + Vite + TypeScript on the frontend and Node.js + Express.js + TypeScript on the backend.
- Application data persistence is planned around Supabase PostgreSQL with Prisma as the ORM.
- Authentication and session infrastructure are planned around Supabase Auth, with Google OAuth provided through Supabase Auth.
- Campus Crypt backend remains authoritative for role, verificationStatus, and account restrictions; the client never owns authorization truth.
- Supabase Storage replaces Cloudinary as the intended file/media storage architecture.
- Socket.io remains the application-level realtime layer.
- The repository still contains earlier implementation artifacts and planning assumptions from the previous custom-auth/JWT/Cloudinary approach; those artifacts must be treated as legacy and superseded by the final SRS-aligned direction.

## Decision log
- The updated SRS supersedes earlier custom-auth assumptions and dated Phase 1 planning.
- Supabase Auth answers "who is this authenticated user?" while the Campus Crypt backend answers "what is this user allowed to do?"
- Authorization must be derived from current database-backed user and permission state rather than stale JWT claims.
- The final architecture explicitly rejects custom Google OAuth callbacks, custom JWT issuance, and an in-memory session system as the primary production path.
- Cloudinary is not the required storage architecture; Supabase Storage is the authoritative direction.
- Phase 2 product features remain out of scope for this phase and should not be implemented during Phase 1.

## Next action
Phase 1 is complete. The next approved roadmap phase is Phase 2 - University communities and profiles, but implementation should not start until it is explicitly approved and scoped.
