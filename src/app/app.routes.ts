import { Routes } from '@angular/router';
import { CustomersTable } from './components/customers-table/customers-table';
import { UserPage } from './components/user-page/user-page';
import { ProductsPage } from './components/products-page/products-page';
import { ContactPage } from './components/contact-page/contact-page';
import { CarriersPage } from './components/carriers-page/carriers-page';
import { CartPage } from './components/cart-page/cart-page';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { LoginPage } from './components/login-page/login-page';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'customers', component: CustomersTable, canDeactivate: [PendingChangesGuard], runGuardsAndResolvers: 'always', canActivate: [AuthGuard] },
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
