# Contributing

## Branches

Lightweight trunk-based flow:

- `main` — stable, deployable; protected (PRs only, required checks).
- `feature/*`, `fix/*`, `refactor/*`, `ci/*` — short-lived branches off `main` (or off a parent branch
  for stacked work, e.g. `feature/workspace-kanban` → `feature/workspace`).
- Merge with a merge commit after review and green CI; delete the branch.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`

Types: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `build`, `ci`, `chore`, `perf`.
Scopes: `auth`, `kanban`, `projects`, `community`, `media`, `profiles`, `dashboard`, `data`, `server`,
`shared`, `docker`, `e2e`.

## Before opening a PR

```bash
npm run format:check && npm run lint && npm run typecheck && npm test
npm run test:e2e   # for user-facing changes (needs Supabase local)
```

Rules that reviewers check:

- Every mutation authorizes on the server (`authorizeProject`/ownership), never trusts client ids.
- New `public` tables enable RLS in the same migration.
- Validate all input with schemas in `packages/shared/`.
- UI follows the Liner Notes design system (`frontend/DESIGN.md`); test dark + light, 320–1440 px.

## Releases

1. Update `CHANGELOG.md` and bump `version` in the root `package.json`.
2. Merge to `main`, then `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. `release.yml` verifies the tag matches the version and publishes a GitHub Release with the
   changelog section.
