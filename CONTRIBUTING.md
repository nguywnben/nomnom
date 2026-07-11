# Contributing to NomNom

Thank you for helping improve NomNom. This repository is an educational graduation project, so contributions should be focused, reviewable, and consistent with the documented project scope.

## Before You Start

1. Read the [README](./README.md), [project documentation](./docs/README.md), and relevant planning file.
2. Search existing issues and pull requests before starting duplicate work.
3. For large features, API changes, database changes, or security-sensitive work, open a proposal first.
4. Never include real customer data, credentials, tokens, private keys, or production URLs in code, screenshots, logs, or fixtures.

## Local Development

```bash
git clone https://github.com/nguywnben/nomnom.git
cd nomnom

cd server
npm ci
cp .env.example .env

cd ../client
npm ci
cp .env.example .env
```

Create and import the local database as described in the [README](./README.md), then start the API and client in separate terminals.

## Branches

Create a short-lived branch from the current integration branch:

```text
feature/<issue>-<short-name>
fix/<short-name>
docs/<short-name>
chore/<short-name>
```

Examples: `feature/cus-10-voucher-validation`, `fix/order-total-rounding`, `docs/public-readme`.

## Coding Guidelines

- Follow existing React, Express, and SQL patterns in the repository.
- Keep changes scoped to one concern; avoid unrelated refactors.
- Validate external input at API boundaries and use parameterized SQL queries.
- Enforce resource ownership and role checks on protected endpoints.
- Store money as integer VND values.
- Keep user-facing product copy in Vietnamese unless the surrounding surface is project documentation.
- Add comments only when they explain a non-obvious decision.
- Do not add a dependency when the platform or existing stack already solves the problem.

## Database Changes

- Add forward migrations to `database/migrations/`.
- Add a matching rollback migration when rollback is safe.
- Never place production data or exported session/authentication records in a migration or seed.
- Document the migration order and any destructive operation.
- Back up the target database before testing a destructive migration.

## Quality Checks

Run the checks relevant to your change:

```bash
cd client
npm run lint
npm run build

cd ../server
node --check src/index.js
```

The automated test suite is still being established. Until it is complete, document the manual flows you tested in the pull request. New business logic should include regression tests whenever the affected area has a test harness.

## Commit Messages

Use concise conventional-style messages:

```text
feat: add voucher validation endpoint
fix: prevent duplicate order status transitions
docs: document public contribution workflow
chore: update lint configuration
```

Commits should explain one logical change and must not contain generated build output or secrets.

## Pull Requests

- Fill out the pull request template completely.
- Link the related issue or planning item.
- Describe behavior and data-model changes, not only files changed.
- Include screenshots for visible UI changes.
- List commands and manual scenarios used for verification.
- Call out migrations, new environment variables, security implications, and rollback steps.
- Keep the pull request open for human review before merge.

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md) and the [Security Policy](./SECURITY.md).
