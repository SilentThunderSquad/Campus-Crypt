# Campus-Crypt

## Project overview
Campus-Crypt is a university community and review platform designed for students to discover universities, share experiences, participate in campus discussions, and access structured community knowledge with trust and moderation safeguards.

The platform is intended to balance public exploration with verified participation. Users can browse communities and content without full verification, while verified students unlock the ability to create posts, rate institutions, answer questions, and engage in direct messaging and social features.

## Repository context
- Repository: SilentThunderSquad/Campus-Crypt
- Default branch: main
- Primary stack: React + Vite + TypeScript on the frontend; Node.js + Express.js + TypeScript on the backend
- Data layer: Supabase PostgreSQL with Prisma ORM
- Authentication and session layer: Supabase Auth with Google OAuth through Supabase Auth
- Application authorization: Campus Crypt backend is authoritative for role, verificationStatus, restrictions, and admin permissions
- Storage: Supabase Storage
- Realtime: Socket.io
- Deployment: Vercel for frontend; Railway/Render for backend; Supabase for managed backend infrastructure

## Strategic goals
1. Create a trusted university-specific discussion ecosystem.
2. Enable verified student participation while preserving open browsing access.
3. Offer structured university reviews and aggregated ratings.
4. Support community identity through unique profile and university URLs.
5. Ensure secure, moderated, and maintainable platform operations.
6. Treat Supabase Auth as the authentication/session infrastructure while the Campus Crypt backend remains the authorization authority.

## In-scope capabilities for Phase 1
- Supabase project/database configuration
- Prisma connection to Supabase PostgreSQL
- Application user identity mapping to Supabase Auth identity
- Google OAuth through Supabase Auth
- Authentication/session integration between Supabase Auth and Express
- Backend authentication middleware
- Backend authorization middleware
- Guest/unverified/verified/admin access model
- Client authentication state and protected-route UX
- Security baseline and test coverage

## Out-of-scope for initial implementation
- University communities
- Profiles beyond the authentication identity foundation
- Posts
- Ratings
- Q&A
- Voting
- Notifications
- Following
- Messaging
- Moderation dashboard

## Core constraints
- The authoritative architecture is defined by the repository-root SRS and is not overridden by older planning assumptions.
- Supabase Auth answers "who is this authenticated user?" while the Campus Crypt backend answers "what is this user allowed to do?"
- Role and verificationStatus must be derived from the current application database state; they are not authoritative when coming from JWT claims alone.
- Custom Google OAuth callbacks, custom JWT issuance, and custom session infrastructure are out of scope for the final architecture.
- Guest and unauthenticated users must be redirected away from protected flows.
- Usernames and university slugs must remain unique and URL-safe.
- Maintenance mode must restrict regular access while preserving admin control.
- Security protections must be enforced through route guards, validation, and logging.

## Success measures
- Supabase-backed authentication and session flow is established according to the final architecture.
- Backend authorization is enforced against current database state.
- Authenticated and unauthenticated experiences are clearly separated.
- Verified and admin access rules are enforced in server-side middleware.
- The platform is ready for iterative phased implementation beyond the Phase 1 foundation without entering Phase 2 prematurely.

## Source of truth
This project is governed by the repository-root SRS and the final architecture decision captured there. Planning and implementation work must remain aligned to that source of truth and must not silently preserve outdated custom-auth or Cloudinary assumptions.
