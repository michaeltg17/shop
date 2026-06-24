## shop
[![CI-API](https://github.com/michaeltg17/shop/actions/workflows/ci-api.yml/badge.svg)](https://github.com/michaeltg17/shop/actions/workflows/ci-api.yml)
[![CI-UI](https://github.com/michaeltg17/shop/actions/workflows/ci-ui.yml/badge.svg)](https://github.com/michaeltg17/shop/actions/workflows/ci-ui.yml)
[![CD](https://github.com/michaeltg17/shop/actions/workflows/cd.yml/badge.svg)](https://github.com/michaeltg17/shop/actions/workflows/cd.yml)
![Coverage UI](./badges/coverage-total.svg)
[![Mutation testing UI](https://img.shields.io/endpoint?style=plastic&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmichaeltg17%2Fshop%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/michaeltg17/shop/main)

### Project
https://github.com/users/michaeltg17/projects/4

Simple shop app to test the limits of a local AI dev working 24-7.

Built with local AI.
 - Model: cyankiwi/Qwen3.6-27B-AWQ-BF16-INT4 running on 2x RTX 3090. Windows + docker vllm.
 - "Manual" harness: cline extension on vscode
 - Automated harness: OpenClaw

### API
- .NET 10

### UI

- Angular 21
- Angular Material 3

### Testing

- Jest (for stryker compatibility)
- Stryker
- MSW (Mock Service Worker)
- Playwright

### Linting & Formatting

- Prettier
- `angular-eslint`
- EditorConfig

### Pipelines
### CI

- CI in Docker
- GitHub Actions

### CD

- Ubuntu Server + Docker
