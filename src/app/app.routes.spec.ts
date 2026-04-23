import { routes } from './app.routes';
import { CustomersTable } from './features/customers/components/customers-table/customers-table';
import { UserPage } from './shared/pages/user-page/user-page';
import { ProductsPage } from './features/products/components/products-page/products-page';
import { ContactPage } from './shared/pages/contact-page/contact-page';
import { CarriersPage } from './features/carriers/components/carriers-page/carriers-page';
import { CartPage } from './features/cart/components/cart-page/cart-page';
import { LoginPage } from './shared/pages/login-page/login-page';
import { PendingChangesGuard } from './core/auth/guards/pending-changes.guard';
import { AuthGuard } from './core/auth/guards/auth.guard';

describe('app.routes', () => {
  it('should define routes as a non-empty array', () => {
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have a root redirect to login', () => {
    const rootRoute = routes.find(r => r.path === '');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.redirectTo).toBe('login');
    expect(rootRoute?.pathMatch).toBe('full');
  });

  it('should have a login route with LoginPage component', () => {
    const loginRoute = routes.find(r => r.path === 'login');
    expect(loginRoute).toBeDefined();
    expect(loginRoute?.component).toBe(LoginPage);
  });

  it('should have a customers route with CustomersTable and guards', () => {
    const route = routes.find(r => r.path === 'customers');
    expect(route).toBeDefined();
    expect(route?.component).toBe(CustomersTable);
    expect(route?.canDeactivate).toContain(PendingChangesGuard);
    expect(route?.canActivate).toContain(AuthGuard);
    expect(route?.runGuardsAndResolvers).toBe('always');
  });

  it('should have a customers/new route', () => {
    const route = routes.find(r => r.path === 'customers/new');
    expect(route).toBeDefined();
    expect(route?.component).toBe(CustomersTable);
    expect(route?.canDeactivate).toContain(PendingChangesGuard);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should have a customers/:id route', () => {
    const route = routes.find(r => r.path === 'customers/:id');
    expect(route).toBeDefined();
    expect(route?.component).toBe(CustomersTable);
    expect(route?.canDeactivate).toContain(PendingChangesGuard);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should have a customers/:id/edit route', () => {
    const route = routes.find(r => r.path === 'customers/:id/edit');
    expect(route).toBeDefined();
    expect(route?.component).toBe(CustomersTable);
    expect(route?.canDeactivate).toContain(PendingChangesGuard);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should have a user route with AuthGuard', () => {
    const route = routes.find(r => r.path === 'user');
    expect(route).toBeDefined();
    expect(route?.component).toBe(UserPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should have a products route with AuthGuard', () => {
    const route = routes.find(r => r.path === 'products');
    expect(route).toBeDefined();
    expect(route?.component).toBe(ProductsPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should have a cart route with AuthGuard', () => {
    const route = routes.find(r => r.path === 'cart');
    expect(route).toBeDefined();
    expect(route?.component).toBe(CartPage);
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('should have a contact route without AuthGuard', () => {
    const route = routes.find(r => r.path === 'contact');
    expect(route).toBeDefined();
    expect(route?.component).toBe(ContactPage);
    expect(route?.canActivate).toBeUndefined();
  });

  it('should have a carriers route without AuthGuard', () => {
    const route = routes.find(r => r.path === 'carriers');
    expect(route).toBeDefined();
    expect(route?.component).toBe(CarriersPage);
    expect(route?.canActivate).toBeUndefined();
  });
});
