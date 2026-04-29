# Campus-Crypt

Professional full-stack folder structure for a modern website project.

Every major folder in this scaffold includes its own README so the purpose of each area stays documented as the project grows.

## Suggested Structure

```text
Campus-Crypt/
├── client/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── lib/
│       ├── styles/
│       ├── assets/
│       └── types/
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       ├── models/
│       └── utils/
├── shared/
│   ├── types/
│   ├── constants/
│   └── validators/
├── docs/
├── infra/
├── scripts/
└── tests/
    ├── unit/
    └── integration/
```

## Purpose

- `client/` holds the website frontend.
- `server/` holds the API, business logic, and database access.
- `shared/` holds code used by both client and server.
- `tests/` separates unit and integration coverage.
- `infra/` and `scripts/` keep deployment and automation cleanly separated.

If you want, the next step is to turn this scaffold into a specific stack such as Next.js + Express + PostgreSQL, or React + Node + MongoDB.
