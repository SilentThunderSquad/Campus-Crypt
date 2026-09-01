# Conventions

## Naming and style
- Client code uses JavaScript/JSX, not TypeScript, in the currently implemented files
- Component naming is PascalCase (`ComingSoon`)
- React files use lowercase directories for feature grouping and `src/` organization
- Imports are ES module style with direct relative imports
- Semicolons are not used in the current codebase

## Folder conventions
The repo follows a conventional separation model:
- `client/` for UI
- `server/` for auth and API logic
- `shared/` for cross-cutting business logic and validation
- `tests/` for separate unit/integration coverage

## Architecture conventions implied by the repo
- Feature logic is expected to be separated by layer (`routes`, `controllers`, `services`, `models`)
- Security code is expected to live in middleware/config rather than directly in route handlers
- UI should remain isolated from backend logic in the frontend app

## Current reality
The conventions are scaffolded but not yet enforced by real domain code. There is no existing test or lint architecture around these conventions beyond the client package script.

## Recommendation
As implementation begins, keep the established separation strict: UI-only logic in the client, request validation in middleware/controllers, domain behavior in services, and database logic in models or Prisma access layer.
