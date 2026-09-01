Campus Crypt - Software Requirements Specification (SRS)
========================================================

1\. Introduction
----------------

### 1.1 Project Name

**Campus Crypt**

### 1.2 Project Overview

Campus Crypt is a secure, verified university community and review platform designed to help students and academic communities explore, discuss, review, and evaluate universities.

The platform combines:

*   University communities
    
*   Student profiles
    
*   Discussion forums
    
*   University reviews and ratings
    
*   Q&A
    
*   Social following
    
*   Private messaging
    
*   Notifications
    
*   Moderation
    
*   Administration
    
*   Secure authentication
    
*   Verification-based participation
    

The platform is designed with security, verification, scalability, reliability, and maintainability as first-class requirements.

2\. Objectives
==============

The primary objectives of Campus Crypt are:

*   Provide university-specific online communities.
    
*   Allow users to explore universities and student experiences.
    
*   Enable verified users to participate in trusted community discussions.
    
*   Allow users to review and rate universities.
    
*   Provide a dedicated Q&A system.
    
*   Enable social interactions between users.
    
*   Provide secure private messaging.
    
*   Provide moderation and administrative controls.
    
*   Provide secure authentication and account protection.
    
*   Maintain strong access control based on authentication and verification state.
    
*   Provide a scalable architecture suitable for online deployment.
    

3\. User Types and Access Levels
================================

Campus Crypt supports the following access states.

3.1 Guest Users
---------------

Guest users are not authenticated.

Guests can:

*   Browse public university content.
    
*   View public university information.
    
*   View public posts, discussions, ratings, and Q&A content where permitted.
    

Guests cannot:

*   Access protected user interactions.
    
*   Create posts.
    
*   Vote.
    
*   Rate.
    
*   Send private messages.
    
*   Access protected routes.
    

3.2 Authenticated Unverified Users
----------------------------------

Authenticated but unverified users can:

*   Browse university communities.
    
*   View posts and discussions.
    
*   Reply within existing discussions.
    
*   Ask questions in Q&A.
    
*   Follow users.
    

Unverified users cannot:

*   Create standalone discussion posts.
    
*   Vote on posts/comments.
    
*   Answer Q&A questions.
    
*   Perform verified-only community actions.
    

3.3 Verified Users
------------------

Verified users can:

*   Join university communities.
    
*   Create posts.
    
*   Comment and reply.
    
*   Vote.
    
*   Rate universities.
    
*   Answer Q&A questions.
    
*   Follow users.
    
*   Send private messages.
    
*   Use other verified-only community interactions.
    

3.4 Admin Users
---------------

Administrators have elevated platform-management privileges.

Admins can:

*   Moderate content.
    
*   Manage users.
    
*   Manage university communities.
    
*   Restrict or ban users.
    
*   Control maintenance mode.
    
*   View security/activity logs.
    
*   Monitor suspicious activity.
    
*   Perform administrative platform operations.
    

4\. Functional Requirements
===========================

4.1 Authentication System
-------------------------

Campus Crypt shall provide secure passwordless authentication.

### Authentication Provider

The primary authentication provider shall be:

*   **Supabase Auth**
    
*   **Google OAuth**
    

Supabase Auth will provide the authentication infrastructure and session management required for user authentication.

The application shall not implement traditional username/password authentication.

### Authentication Requirements

The system shall support:

*   Google-based social authentication.
    
*   Secure authentication sessions.
    
*   Authentication state detection.
    
*   Login/logout.
    
*   Session expiration handling.
    
*   Protected route handling.
    
*   Authentication failure handling.
    
*   Secure browser session handling.
    

4.2 Authentication and Application Authorization
------------------------------------------------

Authentication and authorization are separate concerns.

### Authentication

Supabase Auth is responsible for establishing the authenticated identity and authentication session.

### Application Authorization

Campus Crypt's backend shall remain authoritative for application-level permissions.

The backend shall determine access using the current Campus Crypt user record and its current:

*   Role
    
*   Verification status
    
*   Account restrictions
    

The frontend shall not be treated as the authoritative security boundary.

4.3 Verification System
-----------------------

The platform shall provide a verification-based participation system.

Verification is distinct from authentication.

A user may be authenticated without being verified.

The platform shall support verification states required by the product, including the ability to distinguish:

*   Unverified users
    
*   Verified users
    

The architecture shall remain extensible for participation labels such as:

*   Verified Student
    
*   Alumni
    
*   Faculty
    

4.4 Multi-Factor Authentication
===============================

Campus Crypt shall support account security through MFA capabilities provided through the selected authentication infrastructure.

The architecture shall support:

*   Authenticator application MFA.
    
*   Passkey support where supported by the authentication provider.
    
*   MFA enable/disable functionality.
    
*   Sensitive authentication verification.
    
*   Device/session trust management.
    

OTP-based authentication remains outside the current scope unless explicitly introduced in a future requirements revision.

4.5 University Community System
===============================

The platform shall provide university-specific communities.

Each university community shall have:

*   Unique identity.
    
*   Unique URL slug.
    
*   University information.
    
*   Community feed.
    
*   Discussions.
    
*   Ratings.
    
*   Q&A.
    
*   Member information.
    

Example:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   https://domain.com/u/{slug}   `

4.6 User Profiles
=================

Users shall have public profile pages.

Example:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   https://domain.com/profile/{username}   `

Profiles shall support:

*   Unique usernames.
    
*   Public profile representation.
    
*   Shareable URLs.
    
*   User information.
    
*   Community activity where permitted.
    
*   Following information.
    

Username rules:

*   Usernames must be unique.
    
*   Reserved keywords must be restricted.
    
*   Usernames must be URL-safe.
    

4.7 Community Feed
==================

Each university community shall provide a feed containing relevant community activity.

The feed may contain:

*   Posts.
    
*   Discussions.
    
*   Reviews.
    
*   Q&A activity.
    
*   Community interactions.
    

Access to interactions shall follow the authentication and verification rules.

4.8 Discussion and Posts
========================

Verified users shall be able to create standalone discussion posts.

Users shall be able to:

*   Create posts.
    
*   View posts.
    
*   Edit their own posts where permitted.
    
*   Comment.
    
*   Reply.
    
*   Participate in nested discussions.
    

Unverified users shall be able to:

*   Read discussions.
    
*   Reply within existing discussions.
    

Unverified users shall not be able to create standalone discussion posts.

4.9 University Reviews and Ratings
==================================

Verified users shall be able to submit university reviews and ratings.

The platform shall support rating categories defined by the product.

Potential rating categories include:

*   Academics
    
*   Faculty
    
*   Placements
    
*   Infrastructure
    
*   Campus Life
    
*   Hostel
    
*   Food
    
*   Location
    

The platform shall calculate aggregated university scores from rating data.

Rating systems shall prevent unauthorized or duplicate voting/rating behavior according to application rules.

4.10 Q&A System
===============

Campus Crypt shall provide a dedicated Q&A system.

Users shall be able to:

*   Ask questions.
    
*   View questions.
    
*   View answers.
    

Unverified users can ask Q&A questions.

Only verified users can answer Q&A questions.

The system shall support contextual questions where appropriate.

4.11 Voting System
==================

The platform shall support:

*   Upvotes.
    
*   Downvotes.
    
*   Comment voting.
    

Voting shall be restricted according to verification and authentication requirements.

Voting results may influence:

*   Content ranking.
    
*   Feed ordering.
    
*   Visibility.
    

4.12 Follow System
==================

Users shall be able to:

*   Follow users.
    
*   Unfollow users.
    
*   View follower counts.
    
*   View following counts.
    

Following relationships may influence:

*   Personalized feeds.
    
*   Suggested users.
    
*   Notifications.
    

4.13 Notification System
========================

The platform shall provide notifications for relevant activity.

Potential notification events include:

*   Replies.
    
*   Follows.
    
*   Community activity.
    
*   Other user interactions.
    

Notification delivery shall support both persistent notification state and realtime delivery where applicable.

4.14 Private Messaging
======================

The platform shall provide secure user-to-user private messaging.

Authenticated users shall be able to:

*   Send direct messages.
    
*   Receive messages.
    
*   View conversation history.
    

Messaging shall require authentication.

The messaging system shall support:

*   Conversation threads.
    
*   Message history.
    
*   Access restrictions.
    
*   Blocking.
    
*   Reporting.
    

Future enhancements may include:

*   Media sharing.
    
*   Group chats.
    
*   Message reactions.
    
*   Read receipts.
    

4.15 Realtime Communication
===========================

Campus Crypt shall use **Socket.io** for application-level realtime communication.

Realtime capabilities shall support:

*   Private messaging.
    
*   Realtime message delivery.
    
*   Realtime notification delivery.
    
*   Other realtime application events where required.
    

Socket.io shall operate through the backend rather than exposing internal application logic directly to clients.

4.16 File and Media Storage
===========================

Campus Crypt shall use **Supabase Storage** for application file and media storage.

Storage may contain:

*   Profile images.
    
*   University/community images.
    
*   Post media.
    
*   Comment attachments.
    
*   Other permitted user-uploaded files.
    

Storage access shall be protected using appropriate authentication and authorization policies.

The application shall not expose private storage resources to unauthorized users.

4.17 Administration and Moderation
==================================

Administrators shall have access to platform-management capabilities.

Admin functionality shall include:

*   Content moderation.
    
*   User management.
    
*   Community management.
    
*   User restriction.
    
*   User banning.
    
*   Flagged-content handling.
    
*   Maintenance mode.
    
*   Security monitoring.
    

4.18 Maintenance Mode
=====================

The platform shall support maintenance mode.

When maintenance mode is enabled:

*   Normal users shall be prevented from accessing restricted application functionality.
    
*   Administrators shall retain access for management purposes.
    

4.19 Security Mechanisms
========================

Campus Crypt shall implement multiple security mechanisms.

Security requirements include:

*   Secure authentication.
    
*   Secure session management through the authentication provider.
    
*   Passwordless authentication.
    
*   MFA support.
    
*   Passkey support where supported.
    
*   Backend route protection.
    
*   CSRF protection where applicable.
    
*   Rate limiting.
    
*   Request validation.
    
*   Secure cookie/session handling.
    
*   Activity logging.
    
*   Input sanitization.
    
*   XSS prevention.
    
*   SQL injection prevention.
    
*   Secure authorization enforcement.
    

Authentication infrastructure shall be delegated to Supabase Auth where applicable rather than duplicating authentication functionality unnecessarily.

4.20 Security and Activity Monitoring
=====================================

The platform shall maintain:

*   Security logs.
    
*   Login history.
    
*   Suspicious activity tracking.
    
*   Administrative activity logs.
    

Sensitive authentication credentials, access tokens, and secrets shall never be stored in logs.

5\. URL and Routing Requirements
================================

The system shall provide unique URLs for users and university communities.

User Profile URLs
-----------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   https://domain.com/profile/{username}   `

Requirements:

*   Unique usernames.
    
*   Public profile representation.
    
*   Shareable URLs.
    

University URLs
---------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   https://domain.com/u/{slug}   `

Requirements:

*   URL-safe slugs.
    
*   Unique university/community identity.
    
*   University-specific feed.
    
*   Ratings and discussions.
    

Routing and Access Control
--------------------------

Protected routing shall ensure:

*   Guests cannot access protected routes.
    
*   Authenticated users are redirected away from authentication pages.
    
*   Unauthorized users receive appropriate access-denied behavior.
    
*   Requested destinations can be preserved for authentication flows where applicable.
    

6\. Non-Functional Requirements
===============================

Performance
-----------

*   Fast API responses.
    
*   Optimized database queries.
    
*   Efficient client-side data fetching.
    
*   Efficient realtime communication.
    

Security
--------

*   Secure authentication.
    
*   Strong application authorization.
    
*   Protected sessions.
    
*   Secure storage access.
    
*   Protection against common web attacks.
    

Scalability
-----------

The system should support increasing:

*   Users.
    
*   Universities.
    
*   Posts.
    
*   Messages.
    
*   Media.
    
*   Database records.
    

Reliability
-----------

The system should provide reliable:

*   Authentication.
    
*   Database access.
    
*   File storage.
    
*   Messaging.
    
*   Application APIs.
    

Maintainability
---------------

The architecture shall remain:

*   Modular.
    
*   Extensible.
    
*   Testable.
    
*   Maintainable.
    

Responsiveness
--------------

The platform shall support:

*   Desktop.
    
*   Tablet.
    
*   Mobile devices.
    

7\. System Architecture
=======================

The platform follows a scalable client-server architecture using managed backend infrastructure.

Frontend
--------

*   React
    
*   Vite
    
*   TypeScript
    
*   Tailwind CSS
    
*   React Router DOM
    
*   TanStack Query
    
*   Zustand
    

Backend
-------

*   Node.js
    
*   Express.js
    
*   TypeScript
    

The backend shall provide:

*   REST/API endpoints.
    
*   Business logic.
    
*   Application authorization.
    
*   Validation.
    
*   Security middleware.
    
*   Realtime communication integration.
    
*   Prisma-based database access.
    

Database
--------

*   **Supabase PostgreSQL**
    

Supabase shall provide the managed PostgreSQL database used by Campus Crypt.

ORM
---

*   **Prisma ORM**
    

Prisma shall be used by the Express backend for application database access and schema management.

Authentication
--------------

*   **Supabase Auth**
    
*   Google OAuth
    
*   MFA
    
*   Passkey support where supported
    

Supabase Auth shall provide authentication and session infrastructure.

Campus Crypt's backend shall use the authenticated identity to resolve the corresponding application user and enforce current application-level permissions.

Authorization
-------------

Application authorization shall be enforced by the Campus Crypt backend.

Authorization decisions shall use the current database state, including:

*   User role.
    
*   Verification status.
    
*   Account restrictions.
    

Client-side route guards are UX controls only and shall not replace backend authorization.

Realtime Communication
----------------------

*   Socket.io
    

File Storage
------------

*   **Supabase Storage**
    

Supabase Storage shall be used for application media and file storage with appropriate access policies.

Deployment
----------

*   Frontend: Vercel
    
*   Backend: Railway / Render
    
*   Database: Supabase PostgreSQL
    
*   Authentication: Supabase Auth
    
*   File Storage: Supabase Storage
    

8\. Data Entities
=================

The application shall support the following major entities:

*   Users
    
*   Authentication identities
    
*   Universities
    
*   Communities
    
*   Posts
    
*   Comments
    
*   Ratings
    
*   Votes
    
*   Questions
    
*   Answers
    
*   Followers
    
*   Messages
    
*   Conversations
    
*   Notifications
    
*   Sessions
    
*   Reports
    
*   Security logs
    
*   Activity logs
    

Authentication-provider identity/session data shall be managed through Supabase Auth where appropriate, while Campus Crypt-specific user and application data shall remain in the application database.

9\. Authorization Constraints
=============================

The following constraints are mandatory.

### Guest

*   Cannot access protected routes.
    
*   Cannot create posts.
    
*   Cannot vote.
    
*   Cannot rate.
    
*   Cannot message.
    

### Authenticated Unverified

Can:

*   Browse communities.
    
*   Read content.
    
*   Reply within discussions.
    
*   Ask Q&A questions.
    
*   Follow users.
    

Cannot:

*   Create standalone discussion posts.
    
*   Vote.
    
*   Answer Q&A.
    
*   Perform verified-only actions.
    

### Verified User

Can:

*   Join communities.
    
*   Create posts.
    
*   Comment/reply.
    
*   Vote.
    
*   Rate.
    
*   Answer Q&A.
    
*   Follow users.
    
*   Send private messages.
    

### Admin

Can:

*   Manage users.
    
*   Moderate content.
    
*   Manage communities.
    
*   Control maintenance mode.
    
*   Access security/activity logs.
    
*   Restrict or ban users.
    

10\. User Stories
=================

Unverified Users
----------------

*   As an unverified user, I want to explore university communities.
    
*   As an unverified user, I want to ask questions in Q&A.
    
*   As an unverified user, I want to reply within discussions.
    
*   As an unverified user, I want to follow users.
    

Verified Users
--------------

*   As a verified user, I want to create posts and reviews.
    
*   As a verified user, I want to vote and rate universities.
    
*   As a verified user, I want to answer Q&A questions.
    
*   As a verified user, I want to follow users and interact socially.
    
*   As a verified user, I want to send private messages.
    
*   As a verified user, I want to secure my account using MFA.
    

Admin
-----

*   As an admin, I want to moderate content.
    
*   As an admin, I want to manage users.
    
*   As an admin, I want to manage university communities.
    
*   As an admin, I want to control platform maintenance.
    
*   As an admin, I want to monitor security activity and logs.
    

11\. Unique Selling Proposition
===============================

Campus Crypt differentiates itself through:

*   Verified participation system.
    
*   Structured university communities.
    
*   Dedicated Q&A system.
    
*   University review and rating system.
    
*   Secure social authentication.
    
*   MFA/passkey support.
    
*   Social networking features.
    
*   Real-time messaging.
    
*   Secure application-level authorization.
    
*   Integrated managed database, authentication, and storage infrastructure.
    
*   Moderation and administrative controls.
    

12\. Technology Stack Summary
=============================

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   Frontend  ├── React  ├── Vite  ├── TypeScript  ├── Tailwind CSS  ├── React Router DOM  ├── TanStack Query  └── Zustand  Backend  ├── Node.js  ├── Express.js  └── TypeScript  Application Data  ├── Supabase PostgreSQL  └── Prisma ORM  Authentication  ├── Supabase Auth  ├── Google OAuth  ├── MFA  └── Passkeys  Storage  └── Supabase Storage  Realtime  └── Socket.io  Deployment  ├── Vercel  ├── Railway / Render  └── Supabase   `

13\. Constraints
================

*   Only verified users can create standalone discussion posts.
    
*   Only verified users can answer Q&A questions.
    
*   Guests cannot access protected routes.
    
*   Logged-in users cannot access authentication pages unnecessarily.
    
*   Usernames must remain unique.
    
*   University slugs must remain unique and URL-safe.
    
*   Maintenance mode restricts normal access while preserving administrator access.
    
*   Messaging requires authentication.
    
*   Application authorization must be enforced server-side.
    
*   Authentication shall use Supabase Auth.
    
*   PostgreSQL shall be provided by Supabase.
    
*   Prisma shall remain the application ORM.
    
*   File storage shall use Supabase Storage.
    
*   Socket.io shall be used for application-level realtime messaging.
    
*   Real credentials must never be committed to source control.
    
*   Authentication secrets and sensitive session information must not be exposed through logs.
    

14\. Future Enhancements
========================

Potential future enhancements include:

*   Additional social login providers.
    
*   Advanced MFA capabilities.
    
*   Additional passkey capabilities.
    
*   Media sharing in messaging.
    
*   Group chats.
    
*   Message reactions.
    
*   Read receipts.
    
*   Advanced recommendation systems.
    
*   Personalized feeds.
    
*   Advanced moderation automation.
    
*   Advanced analytics.
    
*   Mobile applications.
    

15\. Conclusion
===============

Campus Crypt provides a scalable, secure, and community-driven platform for university exploration, discussion, evaluation, and social interaction.

The system combines:

*   Verified participation.
    
*   University communities.
    
*   Reviews and ratings.
    
*   Q&A.
    
*   Social following.
    
*   Private messaging.
    
*   Realtime communication.
    
*   Secure authentication.
    
*   Application-level authorization.
    
*   Moderation.
    
*   Administrative controls.
    

The platform uses **Supabase as the managed infrastructure layer for PostgreSQL, authentication, and file storage**, while **Prisma remains the application ORM**, **Express remains responsible for backend business logic and authorization**, and **Socket.io provides application-level realtime communication**.

This architecture reduces duplicated infrastructure while maintaining a modular and extensible application design.