# Roadmap

## Phase 1 - Foundation and identity
Goal: Establish project skeleton, auth architecture, and environment baseline.

Deliverables:
- Repository scaffolding finalized around client/server/shared structure
- Frontend and backend app bootstrapping
- Database and Prisma configuration
- Basic auth middleware, route guards, and session model
- OAuth and cookie/JWT security baseline

Verification:
- Users can sign in with Google and access protected routes
- Authenticated users are redirected away from auth screens
- Protected routes fail gracefully for guests

## Phase 2 - University communities and profiles
Goal: Create university-specific identity and public user pages.

Deliverables:
- University/community model and slug routing
- User profile URLs and visibility rules
- Community feed and member access controls
- Public page layout for schools and student profiles

Verification:
- Universities render unique pages and community feeds
- Profile URLs are unique and consistently routed
- Access rules distinguish guest, unverified, verified, and admin states

## Phase 3 - Posts, ratings, and community content
Goal: Build the core publishing and rating experience.

Deliverables:
- Post creation, edit, and visibility rules
- Discussion threading and nested comments
- Review and rating model for university attributes
- Aggregated scoring and feed ranking

Verification:
- Verified users can publish posts and reviews
- Unverified users can read and reply but not create standalone discussions
- Rating data feeds university aggregate scores

## Phase 4 - Q&A, votes, and notifications
Goal: Add interaction systems that make the platform social and active.

Deliverables:
- Q&A flow with verification rules
- Upvote/downvote and comment voting logic
- Notification event model and UI states
- Follow and follower relationship logic

Verification:
- Only verified users answer Q&A items
- Voting changes ranking and visibility behavior
- Notification triggers occur for replies, follows, and community activity

## Phase 5 - Messaging and realtime interaction
Goal: Support private, authenticated communication and realtime flows.

Deliverables:
- Messaging model and conversation threads
- Socket.io event handling
- Real-time notification delivery
- Conversation history and access restrictions

Verification:
- Authenticated users can send and receive direct messages
- Conversation history loads correctly
- Realtime updates are delivered to connected clients

## Phase 6 - Admin moderation and maintenance
Goal: Enforce trust and continuity through platform management tools.

Deliverables:
- Admin dashboards and moderation workflows
- Flagging, content management, and user control tools
- Maintenance mode and admin bypass logic
- Security and access logs

Verification:
- Admins can manage content and lock down the platform
- Maintenance mode blocks normal access while preserving admin access
- Security events are logged and visible to admins

## Phase 7 - Hardening, deployment, and launch
Goal: Prepare the platform for production readiness.

Deliverables:
- Performance tuning and validation
- Deployment configuration for frontend, API, and database
- Security hardening and environment variables
- Final regression and onboarding documentation

Verification:
- Core flows work end-to-end in staging/prod-style setup
- Sensitive data and auth flows are hardened
- The system is ready for release readiness review
