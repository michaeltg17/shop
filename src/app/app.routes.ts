import { Routes } from '@angular/router';
import { CustomersTable } from './components/customers-table/customers-table';
import { UserPage } from './components/user-page/user-page';
import { ProductsPage } from './components/products-page/products-page';
import { CarriersPage } from './components/carriers-page/carriers-page';
import { PendingChangesGuard } from './guards/pending-changes.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' },
  { path: 'customers', component: CustomersTable, canDeactivate: [PendingChangesGuard], runGuardsAndResolvers: 'always' },
  {
    path: 'customers/new',
    component: CustomersTable,
    canDeactivate: [PendingChangesGuard],
    runGuardsAndResolvers: 'always'
  },
  {
    path: 'customers/:id',
    component: CustomersTable,
    canDeactivate: [PendingChangesGuard],
    runGuardsAndResolvers: 'always'
  },
  {
    path: 'customers/:id/edit',
    component: CustomersTable,
    canDeactivate: [PendingChangesGuard],
    runGuardsAndResolvers: 'always'
  },
  { path: 'user', component: UserPage },
  { path: 'products', component: ProductsPage },
  { path: 'carriers', component: CarriersPage }
];
