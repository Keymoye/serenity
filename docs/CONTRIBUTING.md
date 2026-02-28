# Contributing

Please follow these guidelines when contributing to the project.

**Code style**
- TypeScript + ESLint + Prettier. Run `pnpm lint` and format before opening PRs.

**PR checklist**
- **Types & lint:** `pnpm tsc --noEmit` and `pnpm lint` pass
- **Tests:** add tests for new logic and ensure existing tests pass
- **Docs:** update `docs/` when making architectural or public API changes
- **Description:** explain the why behind changes in PR description

**Branching**
- Use feature branches and open PRs against `main` (or the repo's protected branch).
