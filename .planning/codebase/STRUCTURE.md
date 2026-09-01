# Structure

## Root-level layout
- `client/` – React frontend app
- `server/` – Express backend app scaffold
- `shared/` – intended shared domain and validation code
- `docs/` – project documentation and planning artifacts
- `infra/` – deployment and infrastructure support
- `scripts/` – operational scripts
- `tests/` – test suite area
- `README.md` – repo overview
- `Campus Crypt ~ SRS.md` – primary product requirements and design specification

## Client structure
`client/` currently contains:
- `src/App.jsx` – app entry point
- `src/main.jsx` – React mount function
- `src/components/ComingSoon.jsx` – current landing page implementation
- `src/styles/` – styling assets
- `vite.config.js` – Vite configuration
- `package.json` – client dependencies and scripts

## Server structure
`server/src/` was scaffolded by convention with folders:
- `config/`
- `controllers/`
- `middlewares/`
- `models/`
- `routes/`
- `services/`
- `utils/`

At present, these directories are mostly placeholders (`dummy.txt`), indicating the project is at architecture scaffolding stage rather than feature implementation stage.

## Shared structure
The repo outline describes `shared/` as a place for:
- shared types
- constants
- validators

This folder is not yet populated with code in the current snapshot.

## Observed code quality marker
The codebase is intentionally organized for eventual expansion, but it currently lacks real domain implementation. The structure is promising, yet the actual application logic remains to be built.
