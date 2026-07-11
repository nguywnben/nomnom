## Summary

<!-- Explain the user or system outcome of this change. -->

## Related Work

<!-- Link an issue, task, or planning item, for example CUS-10. -->

## Changes

-

## Verification

<!-- List exact commands and manual flows. -->

- [ ] Client lint passes: `cd client && npm run lint`
- [ ] Client build passes: `cd client && npm run build`
- [ ] Relevant server files pass `node --check`
- [ ] Affected user flow was tested manually

## Screenshots

<!-- Required for visible UI changes; remove this section when not applicable. -->

## Database and Configuration

- [ ] No database change
- [ ] Migration and rollback are included and documented
- [ ] No new environment variable
- [ ] New variables are documented in `.env.example` without real values

## Security and Privacy

- [ ] Authorization and ownership checks were considered
- [ ] External input and third-party responses are validated
- [ ] No secrets, live tokens, or personal data are included
- [ ] Error responses do not expose sensitive internals

## Rollback

<!-- Describe how to disable or revert the change safely. -->

## Reviewer Notes

<!-- Call out trade-offs, known limitations, and areas needing special attention. -->
