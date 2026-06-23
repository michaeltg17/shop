# UI - Angular 21

## Stack

Angular 21 standalone components, SCSS, Angular Material 3, RxJS.

## Architecture

src/app/
core/                                     Singletons, auth, shared models
  auth/
    guards/               auth.guard, pending-changes.guard
    interceptors/         auth.interceptor
    services/             auth.service
  models/                 theme.ts, dialogMode.ts
  services/               title, theme, pending-changes
features/                               Domain feature modules
  cart/                     cart-item.ts, cart.service, components/
  orders/                   order.service, components/
  products/                 product.ts, review.ts, product.service, reviews.service, components/
  users/                    user.ts, user.service, components/
    components/
      user-dialog/
      users-table/
        user-cell/
shared/
  components/               base-table, theme-selector, cart-icon, confirmation-dialog
  layouts/                  ecommerce-layout, admin-layout
  pages/                    login-page, user-page, contact-page
  utils/                    stringUtils
app.ts                       Root component
app.routes.ts                Route definitions
app.config.ts                App provider config

### Feature Pattern

Each feature: model.ts -> service.ts + service.spec.ts -> components/

## Selector Conventions

- Components: app-kebab-case (element selectors)
- Directives/Pipes: appCamelCase (attribute selectors)

## Testing

- Unit: Jest, every service/component has a *.spec.ts
- E2E: Playwright, tests in playwright/
- Mocking: MSW for API mocking (worker in src/)
- Mutation: Stryker (npm run stryker)

Rules:
- Every new component/service must have a corresponding .spec.ts
- Use MSW handlers in tests for HTTP mocking
- Prefer real services in component tests, mock at the HTTP layer

## Commands

npm run test          # Jest unit tests
npm run test:coverage # Jest with coverage
npm run lint          # angular-eslint
npm run build         # ng build
npm start             # ng serve
npm run playwright    # E2E tests
npm run prettier      # Format files
npm run stryker       # Mutation testing

## Build Budgets

| Type | Warning | Error |
|---|---|---|
| Initial bundle | 2MB | 3MB |
| Component style | 4kB | 8kB |

## Formatting

- Prettier for .ts, .html, .css, .scss, .json, .md
- EditorConfig for consistent editor settings
- Run npm run prettier before committing
