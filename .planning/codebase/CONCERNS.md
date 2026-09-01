# Concerns

## Product and delivery concerns
- The app is still in an early scaffold stage and has not implemented the core product flows described in the SRS
- There is no working authenticated user lifecycle yet
- There is no database layer or schema in place
- There is no route protection for guest/verified/admin access at runtime

## Technical concerns
- The server is not yet bootstrapped with an application entry point or route registration
- The client is a landing page, not a working product UI
- The `shared/` domain layer is unimplemented
- There is no test harness for regression prevention
- The repo dependency list suggests desired architecture, but the implementation is not yet connected to actual product behavior

## Security concerns
- JWT and cookie support are added but not wired to actual protected route enforcement or session lifecycle management
- No auth guard or middleware is present
- No MFA, passkey, or admin moderation enforcement is yet implemented
- Input validation and abuse protection are not yet represented in application code

## Operational concerns
- Environment variables and deployment configuration are not yet codified
- CI/CD and deployment readiness are not yet modeled
- Monitoring and logging flows are not yet implemented

## Recommendation
Treat the current repository as a greenfield foundation, not as a built application. The immediate objective should be to establish auth, database, route guards, and baseline test coverage before developing feature-heavy flows such as communities, reviews, messaging, and moderation.
