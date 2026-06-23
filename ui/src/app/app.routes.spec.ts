import { routes } from './app.routes';
import { UsersTable } from './features/users/components/users-table/users-table';
import { UserPage } from './shared/pages/user-page/user-page';
import { ProductsPage } from './features/products/components/products-page/products-page';
import { ContactPage } from './shared/pages/contact-page/contact-page';
import { CartPage } from './features/cart/components/cart-page/cart-page';
import { OrdersPage } from './features/orders/components/orders-page/orders-page';
import { LoginPage } from './shared/pages/login-page/login-page';
import { PendingChangesGuard } from './core/auth/guards/pending-changes.guard';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { AdminLayout } from './shared/layouts/admin-layout/admin-layout';
import { EcommerceLayout } from './shared/layouts/ecommerce-layout/ecommerce-layout';

describe('app.routes', () => {
  it('should define routes as a non-empty array', () => {
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have a root redirect to login', () => {
    const rootRoute = routes.find(r => r.path === '');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.redirectTo).toBe('shop/products');
    expect(rootRoute?.pathMatch).toBe('full');
  });

  it('should have a login route with LoginPage component', () => {
    const loginRoute = routes.find(r => r.path === 'login');
    expect(loginRoute).toBeDefined();
    expect(loginRoute?.component).toBe(LoginPage);
  });

  it('should have an admin layout route', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    expect(adminRoute).toBeDefined();
    expect(adminRoute?.component).toBe(AdminLayout);
    expect(adminRoute?.canActivate).toContain(AuthGuard);
    expect(Array.isArray(adminRoute?.children)).toBe(true);
    expect(adminRoute?.children?.length).toBeGreaterThan(0);
  });

  it('should have admin redirect to users by default', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    const redirectRoute = adminRoute?.children?.find(c => c.path === '');
    expect(redirectRoute).toBeDefined();
    expect(redirectRoute?.redirectTo).toBe('users');
    expect(redirectRoute?.pathMatch).toBe('full');
  });

  it('should have users routes nested under admin', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    const usersRoute = adminRoute?.children?.find(c => c.path === 'users');
    expect(usersRoute).toBeDefined();
    expect(usersRoute?.component).toBe(UsersTable);
    expect(usersRoute?.canDeactivate).toContain(PendingChangesGuard);
    expect(usersRoute?.runGuardsAndResolvers).toBe('always');
  });

  it('should have users/new route nested under admin', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    const route = adminRoute?.children?.find(c => c.path === 'users/new');
    expect(route).toBeDefined();
    expect(route?.component).toBe(UsersTable);
    expect(route?.canDeactivate).toContain(PendingChangesGuard);
    expect(route?.runGuardsAndResolvers).toBe('always');
  });

  it('should have users/:id route nested under admin', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    const route = adminRoute?.children?.find(c => c.path === 'users/:id');
    expect(route).toBeDefined();
    expect(route?.component).toBe(UsersTable);
    expect(route?.canDeactivate).toContain(PendingChangesGuard);
    expect(route?.runGuardsAndResolvers).toBe('always');
  });

  it('should have users/:id/edit route nested under admin', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    const route = adminRoute?.children?.find(c => c.path === 'users/:id/edit');
    expect(route).toBeDefined();
    expect(route?.component).toBe(UsersTable);
    expect(route?.canDeactivate).toContain(PendingChangesGuard);
    expect(route?.runGuardsAndResolvers).toBe('always');
  });

  it('should have user route nested under admin', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    const route = adminRoute?.children?.find(c => c.path === 'user');
    expect(route).toBeDefined();
    expect(route?.component).toBe(UserPage);
  });

  it('should have products route nested under admin', () => {
    const adminRoute = routes.find(r => r.path === 'admin');
    const route = adminRoute?.children?.find(c => c.path === 'products');
    expect(route).toBeDefined();
    expect(route?.component).toBe(ProductsPage);
  });

  it('should have a shop (ecommerce) layout route', () => {
    const shopRoute = routes.find(r => r.path === 'shop');
    expect(shopRoute).toBeDefined();
    expect(shopRoute?.component).toBe(EcommerceLayout);
    expect(Array.isArray(shopRoute?.children)).toBe(true);
    expect(shopRoute?.children?.length).toBeGreaterThan(0);
  });

  it('should have products route nested under shop', () => {
    const shopRoute = routes.find(r => r.path === 'shop');
    const route = shopRoute?.children?.find(c => c.path === 'products');
    expect(route).toBeDefined();
    expect(route?.component).toBe(ProductsPage);
  });

  it('should have cart route nested under shop', () => {
    const shopRoute = routes.find(r => r.path === 'shop');
    const route = shopRoute?.children?.find(c => c.path === 'cart');
    expect(route).toBeDefined();
    expect(route?.component).toBe(CartPage);
  });

  it('should have orders route nested under shop', () => {
    const shopRoute = routes.find(r => r.path === 'shop');
    const route = shopRoute?.children?.find(c => c.path === 'orders');
    expect(route).toBeDefined();
    expect(route?.component).toBe(OrdersPage);
  });

  it('should have contact route nested under shop', () => {
    const shopRoute = routes.find(r => r.path === 'shop');
    const route = shopRoute?.children?.find(c => c.path === 'contact');
    expect(route).toBeDefined();
    expect(route?.component).toBe(ContactPage);
  });
});
