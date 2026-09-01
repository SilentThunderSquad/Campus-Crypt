# Domain overview

## Product concept
Campus-Crypt is a Reddit-style university community platform that blends community discussion with verified student participation and structured university reviews.

## Target users
- Unverified students browsing public communities
- Verified students participating in discussions and reviews
- University community members creating and consuming content
- Platform administrators maintaining trust and platform health

## Unique value proposition
- Verified participation system for credibility
- Structured university-specific discussion and review model
- Q&A with access controls and moderation
- Secure social and messaging features
- Admin-managed maintenance and anti-abuse operations

## Key technical assumptions
- Frontend and backend remain decoupled around a shared API boundary
- Post and review data are university-scoped and role-aware
- User trust is enforced by verification gates, not just UI states
- Privacy and security patterns should be adopted from the start rather than patched later

## Project maturity
This is a greenfield initiative shaped by a robust requirements specification and a clearly-scoped product domain. The repository already has a scaffold, so the next step is to transition from requirements into implementation planning.
