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

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  {
    path: 'customers',
    component: CustomersTable,
    canDeactivate: [PendingChangesGuard],
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard]
  },
  {
    path: 'customers/new',
    component: CustomersTable,
    canDeactivate: [PendingChangesGuard],
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard]
  },
  {
    path: 'customers/:id',
    component: CustomersTable,
    canDeactivate: [PendingChangesGuard],
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard]
  },
  {
    path: 'customers/:id/edit',
    component: CustomersTable,
    canDeactivate: [PendingChangesGuard],
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard]
  },
  { path: 'user', component: UserPage, canActivate: [AuthGuard] },
  { path: 'products', component: ProductsPage, canActivate: [AuthGuard] },
  { path: 'cart', component: CartPage, canActivate: [AuthGuard] },
  { path: 'contact', component: ContactPage },
  { path: 'carriers', component: CarriersPage }
];