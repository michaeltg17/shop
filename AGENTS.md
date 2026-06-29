# Shop Monorepo

## Structure

shop/
+-- api/     .NET 10 Minimal APIs, EF Core, PostgreSQL
+-- ui/      Angular 21, Angular Material 3
+-- README.md

- See individual AGENTS.md in each project for specifics.

## Commit Conventions

- Format: type: description (e.g., feat: add product, fix(ci): update workflows)
- Types: feat, fix, ci, refactor
- Include scope when relevant: fix(badges): ...

## CI/CD

### CI (.github/workflows/)

- `ci.yml` — runs on push/PR to `main` when `api/**` or `ui/**` changes, or `workflow_dispatch`
  - Two parallel jobs: `ci-api` and `ci-ui`, each runs its own CI in Docker
  - API: `docker build -f Dockerfile.ci` + `docker compose -f docker-compose.ci.yml run --rm ci` (.NET 10 SDK + PostgreSQL sidecar)
  - UI: `docker build -f Dockerfile.ci` + `docker compose -f docker-compose.ci.yml run --rm ci` (Playwright image)
  - On push to `main`: both jobs publish their images with `<sha>` and `latest` tags
  - On PR: validates production Docker images build (no push)
  - Artifacts: `api-test-results` and `ui-coverage-reports` (30-day retention)

### CD (.github/workflows/cd.yml)

- Triggers when `ci` succeeds on `main` (`workflow_run` event)
- Sequential webhook deployment to `statikk.mooo.com/deploy`: dev → qa → prod
- Payload: `{"project":"shop","environment":"dev|qa|prod","tag":"<sha>"}`
- Deploy logic extracted to `.github/workflows/deploy.yml` (reusable workflow)
- Deploy server resolves images internally from GHCR (`shop-api:<sha>`, `shop-ui:<sha>`)
- One SHA = one version of both API and UI

### Local CI

- API:  `./ci.sh`, `./ci-docker.sh`, `./ci-docker-build.sh`, `./clean.sh` (from `api/`)
- UI:   `./ci.sh` (from `ui/`)

### Registry

- GitHub Container Registry (GHCR)
- `ghcr.io/michaeltg17/shop-api` — two tags per push: `:<sha>` (pinned deployable version) and `:latest` (moving pointer to most recent)
- `ghcr.io/michaeltg17/shop-ui` — two tags per push: `:<sha>` (pinned deployable version) and `:latest` (moving pointer to most recent)
- SHA tag pins the deployable version; `latest` tracks the most recent successful CI

## General Rules

- Prefer existing conventions over new patterns
- No secret exposure in code or commits
- Lint and format before commits
