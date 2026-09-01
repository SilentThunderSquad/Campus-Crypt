# Testing

## Current state
No automated test suites are present in the checked-in repository.

## Evidence in repo
- `client/package.json` includes a lint command but no test script
- `server/package.json` includes TypeScript tooling but no test or build scripts
- No `tests/` implementation files are present yet
- The `tests/` directory exists at the project outline level but has no actual coverage files

## Target testing strategy
Based on the product requirements and repo structure, the expected future test approach is:
- Frontend: component tests and route flow tests (likely Vitest + React Testing Library)
- Backend: unit tests for auth, route guards, and services
- Integration tests for community flows, moderation actions, and messaging
- Auth-focused regression tests for protected-route redirects and verification checks

## Recommended additions
1. Add a frontend test runner and auth flow smoke tests
2. Add API test coverage for protected endpoints and validation failures
3. Add DB integration tests for university/community and messaging flows
4. Add E2E checks for guest vs verified vs admin access rules

## Current risk
The project has no validation safety net yet, which means auth, moderation, and access-control logic are high-risk until tests are introduced.
