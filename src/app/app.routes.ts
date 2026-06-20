import { Routes } from '@angular/router';
import { CustomersTable } from './features/customers/components/customers-table/customers-table';
import { UserPage } from './shared/pages/user-page/user-page';
import { ProductsPage } from './features/products/components/products-page/products-page';
import { ContactPage } from './shared/pages/contact-page/contact-page';
import { CarriersPage } from './features/carriers/components/carriers-page/carriers-page';
import { CartPage } from './features/cart/components/cart-page/cart-page';
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
      { path: '', redirectTo: 'customers', pathMatch: 'full' },
      {
        path: 'customers',
        component: CustomersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'customers/new',
        component: CustomersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'customers/:id',
        component: CustomersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'customers/:id/edit',
        component: CustomersTable,
        canDeactivate: [PendingChangesGuard],
        runGuardsAndResolvers: 'always',
      },
      { path: 'products', component: ProductsPage },
      { path: 'carriers', component: CarriersPage },
      { path: 'user', component: UserPage },
    ],
  },
  {
    path: 'shop',
    component: EcommerceLayout,
    children: [
      { path: 'products', component: ProductsPage },
      { path: 'cart', component: CartPage },
      { path: 'contact', component: ContactPage },
    ],
  },
];
