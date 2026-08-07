# Wave 5 Completion Report

**Completed:** August 4, 2026  
**Scope:** MER-06, ADM-05, CRS-01

## Delivered

- Merchant wallet, available/reserved balance reconciliation, transaction history, payout history, and validated payout requests.
- Merchant profile, operating, open/closed, and bank settings backed by MySQL.
- Shared customer and merchant notification inbox.
- Admin payout review with strict, idempotent transitions and transfer-reference audit.
- Admin delivered-order financial reporting and whitelisted platform configuration.
- Contextual customer-to-merchant and customer-to-admin chat attached to orders.
- Wave 5 chat migration, rollback migration, and idempotent startup schema check.

## Architecture notes

- Payout is an internal workflow. NomNom does not initiate a bank transfer; an administrator transfers externally and records the reference before completion.
- Funds are reserved while a payout is pending or approved. The wallet is debited only at completion.
- Chat uses HTTP polling so the local Express/MySQL setup needs no Redis or Socket.IO.
- Driver wallet, dispatch, delivery execution, and driver chat are outside Wave 5.

## Database

For a fresh database, apply these files after database/nomnom.sql:

    mysql -u root -p nomnom < database/migrations/20260711_wave4_foundation.sql
    mysql -u root -p nomnom < database/migrations/20260803_wave4_completion.sql
    mysql -u root -p nomnom < database/migrations/20260804_wave5_completion.sql

The API also creates the two Wave 5 chat tables idempotently at startup.

## Automated verification

- Server tests: 16 passed.
- Server syntax: 40 JavaScript files passed.
- Client tests: 2 passed.
- Client ESLint: passed.
- Client production build: passed.
- Git whitespace check: passed.

## Local acceptance

- Completed payout PYT-0100 for 100,000 VND; the wallet was debited exactly once and a repeated completion was idempotent.
- Rejected payout PYT-0101; the reserved balance was released without changing wallet balance.
- Verified customer-to-merchant conversation 1 and customer-to-admin conversation 2 for order ORD-P9X22.
- Verified an unrelated customer receives 404 for the conversation.
- Verified notification read actions and a validated no-op platform configuration update.
- Verified merchant, administrator, customer, notification, payout, settings, finance, config, order, and chat screens at desktop and mobile widths.
- No horizontal overflow or new browser console errors remained after the final fixes.

## Remaining phase

Waves 1-5 complete the customer, merchant, administration, payment, promotion, moderation, finance, configuration, notification, and contextual support scope. The separate driver phase remains documented in docs/planning/driver-phase.txt.
