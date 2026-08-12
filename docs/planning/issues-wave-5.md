# Wave 5 Issue Contracts

Wave 5 completes the customer-to-merchant product surface. Driver dispatch, delivery tracking, driver wallet, and driver chat remain in the separate driver phase.

## MER-06: Merchant wallet, settings, and notifications

Scope: wallet balances and history, validated payout requests, merchant profile/operations/bank settings, and a shared notification inbox.

Acceptance criteria:

- Concurrent payout requests cannot reserve more than the available balance.
- Bank values are snapshotted on each payout and masked in API responses.
- Settings are resolved from the authenticated merchant owner.
- Customer and merchant notifications load from MySQL and support read actions.

## ADM-05: Merchant payouts, financial reporting, and platform config

Scope: filter and review merchant payouts, delivered-order financial metrics, and whitelisted platform configuration.

Acceptance criteria:

- Wallet balance is debited once, only when an approved payout is completed.
- Pending payouts can be approved or rejected; approved payouts can be completed.
- Completion requires a bank transfer reference; rejection releases the reservation.
- Config values are range-validated and custom restaurant commission rates are preserved.

## CRS-01: Contextual one-to-one chat

Scope: customer-to-merchant and customer-to-admin conversations attached to an order, with inbox, history, unread count, read actions, and polling.

Acceptance criteria:

- Only the order customer, restaurant owner, or assigned administrator can access a conversation.
- Messages are limited to 2,000 characters and notify the other participant.
- Customer and merchant order screens create the correct conversation.
- Unauthorized users receive no conversation or message data.

## Quality gate

- Client tests, lint, and production build pass.
- Server unit tests and syntax checks pass.
- Authenticated API smoke tests cover the Wave 5 roles and workflows.
- Desktop and mobile browser checks show no blocking console, network, overflow, or overlap errors.
