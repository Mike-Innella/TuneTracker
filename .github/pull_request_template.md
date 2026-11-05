## What & why

<!-- One or two sentences. Link the issue: Closes #123 -->

## How it was verified

- [ ] `npm run lint && npm run typecheck`
- [ ] `npm test` (unit + integration)
- [ ] `npm run test:e2e` for user-facing changes
- [ ] Screenshots (dark + light, desktop + mobile) for UI changes

## Checklist

- [ ] Conventional Commit title (`feat(kanban): …`, `fix(auth): …`)
- [ ] Authorization enforced server-side for any new mutation
- [ ] New tables get RLS enabled (see docs/architecture/database.md)
- [ ] No secrets, `.env` files or user uploads committed
- [ ] Docs updated if behaviour or setup changed
