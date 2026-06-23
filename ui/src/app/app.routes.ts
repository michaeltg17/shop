import { Routes } from '@angular/router';
import { UsersTable } from './features/users/components/users-table/users-table';
import { UserPage } from './shared/pages/user-page/user-page';
import { ProductsPage } from './features/products/components/products-page/products-page';
import { ContactPage } from './shared/pages/contact-page/contact-page';
import { CartPage } from './features/cart/components/cart-page/cart-page';
import { OrdersPage } from './features/orders/components/orders-page/orders-page';
import { PendingChangesGuard } from './core/auth/guards/pending-changes.guard';
import { LoginPage } from './shared/pages/login-page/login-page';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { AdminLayout } from './shared/layouts/admin-layout/admin-layout';
import { EcommerceLayout } from './shared/layouts/ecommerce-layout/ecommerce-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'shop/products', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'customers', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        component: UsersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'users/new',
        component: UsersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'users/:id',
        component: UsersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'users/:id/edit',
        component: UsersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      { path: 'products', component: ProductsPage },
      { path: 'user', component: UserPage },
    ],
  },
  {
    path: 'shop',
    component: EcommerceLayout,
    children: [
      { path: 'products', component: ProductsPage },
      { path: 'cart', component: CartPage },
      { path: 'orders', component: OrdersPage },
      { path: 'contact', component: ContactPage },
    ],
  },
];
