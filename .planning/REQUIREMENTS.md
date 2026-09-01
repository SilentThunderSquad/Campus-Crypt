# Requirements

## Product requirements

### 1. Authentication and access control
- Support Google OAuth through Supabase Auth as the primary passwordless authentication path.
- Use Supabase Auth for authentication sessions and identity, while the Campus Crypt backend remains the authority for application authorization.
- Maintain secure browser session handling and backend validation of authenticated identity without building a second custom JWT/session system.
- Redirect authenticated users away from auth pages and guest users to login when accessing protected pages.
- Enforce access control at route, resource, and feature levels using current database-backed user, role, and verification state.
- Support MFA/passkey-related security enhancements where supported by Supabase Auth and the application architecture.

### 2. University communities
- Each university must have an independent community profile and slug.
- Public browsing should allow unauthenticated users to read community content.
- Verified users should be able to join university communities and participate in community activity.
- Community pages should expose discussions, ratings, Q&A, and member activity.

### 3. Content creation and moderation
- Verified users can create and manage discussion posts tied to a university.
- Unverified users can browse and reply within discussions but cannot create new independent threads.
- Users can vote on posts and comments to influence ranking and visibility.
- Admins must be able to moderate flagged or harmful content.

### 4. Ratings and review model
- Users must be able to rate attributes such as placements, infrastructure, environment, and hostel facilities.
- Ratings should contribute to aggregated score calculations for a university.
- Review content should be associated with university communities and user identities.

### 5. Q&A system
- Unverified users can ask questions in a public Q&A flow.
- Only verified users can answer questions.
- Flagged or abusive questions and answers must be visible to moderators for review.

### 6. Social features
- Users must have unique profile URLs and public identity pages.
- Users should be able to follow and unfollow others.
- Notification feed should cover replies, threads, follower activity, and community updates.
- Private messaging should enable direct, authenticated communication between users.

### 7. Maintenance and administration
- Admins must be able to toggle maintenance mode.
- During maintenance, regular users should see a maintenance page; admins retain access.
- Admin dashboards should support moderation, log viewing, and user management.

### 8. Security and platform reliability
- All user input must be validated, sanitized, and protected against common injection vectors.
- Security logging should include login activity and suspicious access events.
- Rate limiting, CSRF protection, and secure cookie handling must be part of the platform baseline.
- The system must support high-traffic, multi-device use and future scaling with Supabase-managed identity and managed database infrastructure.

## Non-functional requirements
- Performance: Fast response times for public browsing and protected flows.
- Security: High-trust authentication and access patterns across all routes, with backend authorization derived from the application database.
- Scalability: Support increasing university, content, and user growth using managed Supabase infrastructure.
- Maintainability: Modular architecture with clear separation between frontend, backend, and shared logic.
- Reliability: Stable handling of auth, content, and message flows with managed session and database infrastructure.
- Responsiveness: Mobile-first, device-agnostic user experience.

## Acceptance focus
The work is considered successful when:
- Authenticated and unauthenticated experiences are clearly separated.
- Supabase Auth is used for identity and session establishment without a second custom auth layer.
- Verified users can create community content while unverified users remain restricted appropriately.
- University pages, profiles, and messaging flows are consistently available and protected.
- Moderation, maintenance, and security systems are implementable as first-class platform features.
