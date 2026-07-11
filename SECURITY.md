# Security Policy

NomNom is an educational graduation project and has not completed a production security audit. Do not use the repository as-is to process real payments, production credentials, or personal customer data.

## Supported Versions

Security fixes are applied to the latest code on the active integration branch. Historical tags and old branches are not maintained as supported releases.

## Reporting a Vulnerability

Please do not open a public issue for a suspected vulnerability.

1. Use GitHub Private Vulnerability Reporting from the repository's **Security** tab when available.
2. If private reporting is unavailable, contact the repository owner privately through their GitHub profile and request a secure reporting channel.
3. Include the affected component, reproduction steps, impact, and a minimal proof of concept.
4. Remove secrets, access tokens, personal data, and destructive payloads from the report.

The maintainers will acknowledge a complete report when it is reviewed, assess severity and reachability, and coordinate a fix before public disclosure. Please allow reasonable time for remediation.

## Security Expectations

- Never commit `.env` files, API keys, database passwords, JWT secrets, SMTP credentials, VNPay secrets, private keys, or live tokens.
- Use only synthetic `example.com` identities and fictional phone numbers in seeds, fixtures, screenshots, and issue reports.
- Rotate any credential immediately if it is committed or shared accidentally; deleting it from the latest commit is not sufficient.
- Treat callbacks, uploads, form input, and third-party API responses as untrusted data.
- Verify authentication, authorization, resource ownership, input validation, and transaction boundaries for every sensitive change.
- Run `npm audit` for both packages before a public release and triage all critical/high findings.

## Before Making the Repository Public

Sanitizing the latest files does not remove secrets or personal data from earlier commits. Before changing repository visibility:

1. Audit the full Git history for credentials, personal email addresses, phone numbers, exported sessions, and database dumps.
2. Rotate any credential that may ever have been committed.
3. Use an approved history-rewrite process or publish a clean mirror when sensitive historical data is found.
4. Coordinate the rewrite with every contributor because rewritten commit IDs require fresh clones or branch rebases.
5. Re-run secret scanning on the resulting public history before publishing it.

Do not rewrite shared history casually; preserve a private backup and obtain team approval first.

## Known Scope Limitations

- Authentication uses browser-accessible token storage in the current educational implementation; production deployments should evaluate a hardened cookie-based session design.
- Rate limiting and a complete production security-header policy are not yet documented as enabled.
- VNPay and refund functionality remain planned until their signed callback and idempotency controls are implemented and tested.
- Automated security and integration coverage is incomplete.

These limitations should be resolved before presenting NomNom as production-ready.
