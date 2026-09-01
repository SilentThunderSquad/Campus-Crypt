# Stack

## Frontend
- React 18.2.0
- Vite 8.2.2 for local dev/build pipeline
- TypeScript across the app foundation
- Tailwind CSS for styling consistent with the SRS
- React Router DOM for route-level UX and protected-route handling
- TanStack Query and Zustand for client state and API orchestration

## Backend
- Node.js runtime
- Express.js + TypeScript
- Prisma as the application ORM for Supabase PostgreSQL
- Supabase Auth as the identity and session infrastructure
- Socket.io for realtime application messaging

## Persistence and platform strategy
- The authoritative architecture now targets Supabase PostgreSQL as the managed database layer.
- Prisma is the application ORM over that database.
- Supabase Storage is the storage layer for media and file handling in the final architecture.
- Cloudinary is explicitly not the required storage architecture for the current solution.

## Security and authorization model
- Supabase Auth provides the authenticated user identity and session lifecycle.
- The Campus Crypt backend remains the authoritative authorization layer.
- Authorization decisions must be driven by the current database state: role, verificationStatus, restrictions, and admin permissions.
- JWT role and verification claims are not authoritative and must not be used as the sole access-control source.

## Build and quality tooling
- Client: Vite build and frontend validation workflow
- Server: TypeScript API workflow and test coverage for auth, route guards, and authorization boundaries
- Prisma validation and client generation remain required during the Phase 1 corrective implementation

## Current assessment
The repository is not yet fully aligned to the final architecture. It contains a legacy scaffold and earlier auth assumptions that need to be reconciled with the SRS before the actual Phase 1 corrective implementation begins.
