# Roadmap: Campus Crypt

## Phases

- [x] **Phase 1: Foundation and identity** - Establish project skeleton, auth architecture, and environment baseline.
- [x] **Phase 2: University communities and profiles** - Create university-specific identity and public user pages.
- [ ] **Phase 3: Posts, ratings, and community content** - Build the core publishing and rating experience.
- [ ] **Phase 4: Q&A, votes, and notifications** - Add interaction systems that make the platform social and active.
- [ ] **Phase 5: Messaging and realtime interaction** - Support private, authenticated communication and realtime flows.
- [ ] **Phase 6: Admin moderation and maintenance** - Enforce trust and continuity through platform management tools.
- [ ] **Phase 7: Hardening, deployment, and launch** - Prepare the platform for production readiness.

## Phase Details

### Phase 1: Foundation and identity
**Goal:** Establish project skeleton, auth architecture, and environment baseline.
**Depends on:** Nothing (first phase)
**Requirements:** Authentication and access control; Security and platform reliability
**Success Criteria** (what must be TRUE):
  1. Users can sign in with Google and access protected routes.
  2. Authenticated users are redirected away from auth screens.
  3. Protected routes fail gracefully for guests.
**Deliverables:**
- Repository scaffolding finalized around client/server/shared structure
- Frontend and backend app bootstrapping
- Database and Prisma configuration
- Basic auth middleware, route guards, and session model
- OAuth and cookie/JWT security baseline
**Verification:**
- Users can sign in with Google and access protected routes
- Authenticated users are redirected away from auth screens
- Protected routes fail gracefully for guests
**Plans:** Complete

### Phase 2: University communities and profiles
**Goal:** Create university-specific identity and public user pages.
**Depends on:** Phase 1
**Requirements:** University communities; Social features (profile scope)
**Success Criteria** (what must be TRUE):
  1. Universities render unique pages and community feeds.
  2. Profile URLs are unique and consistently routed.
  3. Access rules distinguish guest, unverified, verified, and admin states.
**Deliverables:**
- University/community model and slug routing
- User profile URLs and visibility rules
- Community feed and member access controls
- Public page layout for schools and student profiles
**Verification:**
- Universities render unique pages and community feeds
- Profile URLs are unique and consistently routed
- Access rules distinguish guest, unverified, verified, and admin states
**Plans:** Complete
**UI hint:** yes

### Phase 3: Posts, ratings, and community content
**Goal:** Users can publish university posts and nested discussions, submit university reviews and ratings, and see aggregated university scores.
**Depends on:** Phase 2
**Requirements:** Content creation; Ratings and review model
**Success Criteria** (what must be TRUE):
  1. Verified users can publish posts and reviews.
  2. Unverified users can read and reply but not create standalone discussions.
  3. Rating data feeds university aggregate scores.
**Deliverables:**
- Post creation, edit, and visibility rules
- Discussion threading and nested comments
- Review and rating model for university attributes
- Aggregated scoring for universities
**Verification:**
- Verified users can publish posts and reviews
- Unverified users can read and reply but not create standalone discussions
- Rating data feeds university aggregate scores
**Plans:** TBD

### Phase 4: Q&A, votes, and notifications
**Goal:** Add interaction systems that make the platform social and active.
**Depends on:** Phase 3
**Requirements:** Q&A system; Content creation and moderation; Social features
**Success Criteria** (what must be TRUE):
  1. Only verified users answer Q&A items.
  2. Voting changes ranking and visibility behavior.
  3. Notification triggers occur for replies, follows, and community activity.
**Deliverables:**
- Q&A flow with verification rules
- Upvote/downvote and comment voting logic
- Notification event model and UI states
- Follow and follower relationship logic
**Verification:**
- Only verified users answer Q&A items
- Voting changes ranking and visibility behavior
- Notification triggers occur for replies, follows, and community activity
**Plans:** TBD
**UI hint:** yes

### Phase 5: Messaging and realtime interaction
**Goal:** Support private, authenticated communication and realtime flows.
**Depends on:** Phase 4
**Requirements:** Social features
**Success Criteria** (what must be TRUE):
  1. Authenticated users can send and receive direct messages.
  2. Conversation history loads correctly.
  3. Realtime updates are delivered to connected clients.
**Deliverables:**
- Messaging model and conversation threads
- Socket.io event handling
- Real-time notification delivery
- Conversation history and access restrictions
**Verification:**
- Authenticated users can send and receive direct messages
- Conversation history loads correctly
- Realtime updates are delivered to connected clients
**Plans:** TBD

### Phase 6: Admin moderation and maintenance
**Goal:** Enforce trust and continuity through platform management tools.
**Depends on:** Phase 5
**Requirements:** Maintenance and administration; Content creation and moderation; Security and platform reliability
**Success Criteria** (what must be TRUE):
  1. Admins can manage content and lock down the platform.
  2. Maintenance mode blocks normal access while preserving admin access.
  3. Security events are logged and visible to admins.
**Deliverables:**
- Admin dashboards and moderation workflows
- Flagging, content management, and user control tools
- Maintenance mode and admin bypass logic
- Security and access logs
**Verification:**
- Admins can manage content and lock down the platform
- Maintenance mode blocks normal access while preserving admin access
- Security events are logged and visible to admins
**Plans:** TBD
**UI hint:** yes

### Phase 7: Hardening, deployment, and launch
**Goal:** Prepare the platform for production readiness.
**Depends on:** Phase 6
**Requirements:** Security and platform reliability; Non-functional requirements
**Success Criteria** (what must be TRUE):
  1. Core flows work end-to-end in staging/prod-style setup.
  2. Sensitive data and auth flows are hardened.
  3. The system is ready for release readiness review.
**Deliverables:**
- Performance tuning and validation
- Deployment configuration for frontend, API, and database
- Security hardening and environment variables
- Final regression and onboarding documentation
**Verification:**
- Core flows work end-to-end in staging/prod-style setup
- Sensitive data and auth flows are hardened
- The system is ready for release readiness review
**Plans:** TBD
**UI hint:** yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and identity | Complete | Complete | Yes |
| 2. University communities and profiles | Complete | Complete | Yes |
| 3. Posts, ratings, and community content | 0/TBD | Not started | - |
| 4. Q&A, votes, and notifications | 0/TBD | Not started | - |
| 5. Messaging and realtime interaction | 0/TBD | Not started | - |
| 6. Admin moderation and maintenance | 0/TBD | Not started | - |
| 7. Hardening, deployment, and launch | 0/TBD | Not started | - |
