# Wave 4 Completion Report

**Implementation date:** August 3, 2026  
**Scope:** CUS-05, CUS-10, MER-05, ADM-04  
**Status:** Implementation complete; VNPay sandbox acceptance is pending local credentials.

## Delivered

### Customer payment and vouchers

- VNPay payment attempts are persisted before redirecting to the gateway.
- Payment URLs include a unique transaction reference, expiry time, integer VND amount, and HMAC-SHA512 signature.
- The Return URL is read-only and polls the trusted server state for UX.
- The GET IPN endpoint verifies signature, merchant code, amount, order, and payment attempt before changing state.
- IPN handling is transactional and idempotent for success, failure, and duplicate callbacks.
- Voucher validation uses the authenticated customer's server-side cart, not client-submitted totals.
- Voucher rules cover restaurant scope, validity window, minimum order, percent/fixed discounts, caps, total quota, and per-customer quota.
- VNPay orders reserve vouchers until IPN success; COD redeems immediately; failed or cancelled orders release quota.

### Merchant operations

- Voucher create, list, update, pause, and safe delete/archive are connected to MySQL and scoped to the authenticated restaurant owner.
- Used vouchers are archived as paused so historical order references remain valid.
- Promotion and review screens use real APIs.
- Merchant reviews support rating/replied filters and PATCH replies.
- Public restaurant reviews expose merchant replies and exclude admin-hidden reviews.
- Merchants cannot cancel paid orders outside the administrator refund workflow.

### Administrator operations

- Order list supports status, payment method, payment status, search, and pagination.
- Order detail includes items, status logs, payment attempts, and refund attempts.
- Paid VNPay cancellation creates an auditable refund attempt and calls the VNPay refund API.
- An order becomes refunded/cancelled only after a signed successful gateway response.
- Failed refund calls leave the order unchanged and store a retryable failure record.
- Review moderation uses real search/rating/visibility filters.
- Hide/unhide and restaurant rating aggregate updates run in one transaction.
- Synthetic review-report counts were removed from the UI.

## API Surface

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/payments/vnpay` | Create a VNPay payment attempt and signed URL |
| GET | `/api/v1/payments/vnpay/return` | Verify return parameters and read payment state |
| GET | `/api/v1/payments/vnpay/ipn` | Trusted server-to-server payment confirmation |
| GET | `/api/v1/vouchers?restaurantId=:id` | List currently available vouchers |
| POST | `/api/v1/vouchers/validate` | Validate a code against the authenticated cart |
| GET/POST | `/api/v1/merchant/me/vouchers` | List or create merchant vouchers |
| PATCH/DELETE | `/api/v1/merchant/me/vouchers/:id` | Update or safely remove/archive a voucher |
| GET | `/api/v1/merchant/me/reviews` | Filtered merchant review list |
| PATCH | `/api/v1/merchant/me/reviews/:id/reply` | Create or update the merchant reply |
| GET | `/api/v1/admin/orders/:id` | Full operational order detail |
| POST | `/api/v1/admin/orders/:id/cancel` | Cancel, or refund then cancel, an order |
| GET/PATCH | `/api/v1/admin/reviews[/:id]` | Review moderation |

The legacy payment creation and return aliases remain temporarily available for compatibility.

## Database

Apply these files after `database/nomnom.sql`, in order:

```bash
mysql -u root -p nomnom < database/migrations/20260711_wave4_foundation.sql
mysql -u root -p nomnom < database/migrations/20260803_wave4_completion.sql
```

The completion migration adds unique payment gateway references, gateway creation timestamps, and the `payment_refunds` audit table. Matching rollback files are included for disposable environments.

## Verification Evidence

- Client regression tests: 2 passed.
- Client ESLint: passed.
- Client production build: 704 modules transformed successfully.
- Server unit tests: 10 passed.
- Backend syntax check: 31 of 31 JavaScript files passed.
- Authenticated API smoke tests passed for admin order list/detail, admin reviews, and merchant reviews.
- Database smoke check confirmed both payment columns and the refund table.
- Missing VNPay credentials fail closed with HTTP 503 before a payment attempt is created.
- Git diff whitespace check passed.

## Final Sandbox Gate

Add the following values directly to `server/.env`; never send or commit them:

```dotenv
VNPAY_TMN_CODE=your_sandbox_terminal_code
VNPAY_HASH_SECRET=your_sandbox_hash_secret
```

The URLs already have sandbox defaults in `server/.env.example`. After adding credentials, complete these final acceptance checks:

1. Successful payment: checkout -> VNPay -> Return -> IPN -> paid/placed order.
2. Cancelled or failed payment: failed order payment state and released voucher reservation.
3. Replayed IPN: no duplicate notification, redemption, or state transition.
4. Admin refund: signed successful response -> refunded/cancelled; failed response -> unchanged order.
