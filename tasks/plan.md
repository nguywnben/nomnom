# Implementation Plan: Wave 5

> **Implementation update (August 4, 2026):** Wave 5 code, schema, UI integration, and automated quality gates are complete. See the completion report in docs/wave-5-completed.md.

## Decisions

- MySQL is the source of truth for wallets, payouts, notifications, configuration, and chat.
- Payout completion requires an external bank reference and debits the wallet exactly once.
- Chat is one-to-one, scoped to an order, and updated by polling.
- Driver operations remain in the later driver phase.

## Delivery phases

- [x] Shared contracts, validation helpers, chat migration, and startup schema.
- [x] MER-06 merchant wallet, payout request, settings, and notifications.
- [x] ADM-05 payout review, financial reporting, and platform configuration.
- [x] CRS-01 contextual chat API, inbox, messages, read state, and order entry points.
- [x] Client API wiring and authenticated route protection.
- [x] Unit tests, lint, syntax checks, production build, and documentation.
- [x] Final authenticated API/browser acceptance on the demonstration database.
- [ ] Team review, commit, push, merge, and optional wave-5-done tag.

## Release boundary

Wave 5 does not include bank-transfer automation, WebSocket infrastructure, or driver dispatch, delivery, wallet, and chat. Those capabilities require a separate acceptance cycle.
