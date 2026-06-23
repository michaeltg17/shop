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

- CI: GitHub Actions - ci-api.yml (.NET), ci-ui.yml (Angular)
- CD: Ubuntu Server + Docker
- Both projects use Docker containers for CI

## General Rules

- Prefer existing conventions over new patterns
- No secret exposure in code or commits
- Lint and format before changes