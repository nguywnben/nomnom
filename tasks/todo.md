# Wave 4 Delivery Checklist

## Completed implementation

- [x] Payment attempt persistence before VNPay redirect.
- [x] Signed payment URL with expiry and unique transaction reference.
- [x] Read-only Return URL and trusted GET IPN processing.
- [x] Signature, merchant, amount, order, and idempotency checks.
- [x] Payment/order/log/notification update in one transaction.
- [x] Server-side voucher validation using the authenticated cart.
- [x] Voucher locking, quota checks, immutable order snapshot, and reservation lifecycle.
- [x] Merchant voucher CRUD with ownership and safe archive behavior.
- [x] Merchant review list/filter/reply and public reply display.
- [x] Admin order list/detail/filter/pagination.
- [x] Auditable VNPay refund before paid-order cancellation.
- [x] Admin review list/search/filter/hide/unhide and aggregate recomputation.
- [x] Database completion migration and rollback.
- [x] Client tests, lint, production build, server tests, syntax checks, API smoke tests.
- [x] No secrets or authentication debug output added to Git.

## Credential-dependent acceptance

- [ ] Add `VNPAY_TMN_CODE` to `server/.env`.
- [ ] Add `VNPAY_HASH_SECRET` to `server/.env`.
- [ ] Complete a successful VNPay sandbox payment and verify the IPN transition.
- [ ] Verify failed/cancelled payment and duplicate IPN behavior against the sandbox.
- [ ] Complete a successful and failed administrator refund against the sandbox.

## Team release actions

- [ ] Review the Wave 4 diff and this completion report.
- [ ] Run the full regression checklist on the demonstration machine.
- [ ] Commit and push the approved implementation.
- [ ] Merge to the agreed release branch.
- [ ] Create `wave-4-done` only after the credential-dependent acceptance checks pass.
