# Integrations

## Existing integrations
### Client app
- React app bootstraps from `client/src/main.jsx`
- Vite handles HMR and bundling
- UI dependencies are still being used as part of the client foundation

### Server app
- Express server package includes core HTTP and security primitives
- The repo currently contains early-stage auth/session experimentation that must be reconciled with the final Supabase-based architecture

## Final architecture integrations
- Google OAuth through Supabase Auth for user login
- Supabase Auth for authentication and session infrastructure
- Supabase PostgreSQL as the managed application database
- Prisma ORM for the application data model and persistence layer
- Supabase Storage for file and media uploads
- Socket.io for realtime messaging and notifications
- MFA / passkey-ready security flow support where available via Supabase Auth and application logic
- Vercel for frontend deployment and Railway/Render for backend deployment
- Supabase as the managed backend/data identity platform

## Current integration maturity
- The repo contains a legacy auth scaffold and early implementation artifacts that do not match the final architecture decision.
- The final Supabase Auth + Prisma + Postgres design is the authoritative path for Phase 1 corrective work.
- The frontend is still mostly a shell rather than a fully implemented client experience.

## Integration risks
- Legacy custom-auth assumptions can be carried forward if planning documents are not synchronized to the final SRS.
- A dual-auth approach would create conflicting authorization sources if custom JWT/session logic is kept running alongside Supabase Auth.
- Cloudinary references and custom JWT assumptions must not remain as required architecture in planning or implementation work.

## Recommendation
The next implementation wave should focus on reconciling the repository to the SRS-driven architecture: Supabase Auth at the identity layer, Prisma over Supabase PostgreSQL at the data layer, and backend authorization based on current database state rather than token claims.
