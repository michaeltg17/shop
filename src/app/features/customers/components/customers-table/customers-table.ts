import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  signal,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Customer } from '../../customer';
import { CustomerService } from '../../customer.service';
import { CustomerCell } from './customer-cell/customer-cell';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmationDialog,
  ConfirmationDialogData,
} from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CustomerDialog } from '../customer-dialog/customer-dialog';
import { DialogMode } from '../../../../core/models/dialogMode';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { BaseTableComponent, ColumnDef } from '../../../../shared/components/base-table/base-table';

@Component({
  selector: 'app-customers-table',
  imports: [MatSnackBarModule, CustomerCell, MatDialogModule, BaseTableComponent],
  templateUrl: './customers-table.html',
  styleUrls: ['./customers-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersTable implements OnInit {
  private customerService = inject(CustomerService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pendingService = inject(PendingChangesService);

  columns: ColumnDef[] = [
    { key: 'id', label: 'Id' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'isActive', label: 'Active' },
  ];

  selection = new SelectionModel<Customer>(true, []);
  dataSource = new MatTableDataSource<Customer>();
  filterValue = '';
  private dialogOpen = signal(false);
  private activeDialogRef: MatDialogRef<CustomerDialog> | null = null;

  customers = this.customerService.customers;
  loading = this.customerService.loading;
  error = this.customerService.error;

  readonly errorEffect = effect(() => {
    const msg = this.error();
    if (msg) {
      this.snackBar.open(msg, 'Close', { duration: 4000 });
    }
  });

  readonly tableEffect = effect(() => {
    this.dataSource.data = this.customers();
    this.changeDetectorRef.markForCheck();
  });

  readonly routeEffect = effect(() => {
    const rs = this.routeState();
    const customers = this.customers();

    if (this.dialogOpen()) return;

    const { id, isNew, isEdit } = rs;

    if (!customers.length) return;

    if (isNew) {
      this.dialogOpen.set(true);
      const ref = this.openAddDialog();
      ref.afterClosed().subscribe(result => {
        this.dialogOpen.set(false);
        this.pendingService.clear();
        this.pendingService.clearActiveDialog();
        this.router.navigate(['/customers']);
        if (result) this.customerService.addCustomer(result);
      });
      return;
    }

    if (!id) return;

    const customer = customers.find(c => c.id === +id);
    if (!customer) return;

    this.dialogOpen.set(true);
    const ref = isEdit ? this.openEditDialog(customer) : this.openViewDialog(customer);
    ref.afterClosed().subscribe(result => {
      this.dialogOpen.set(false);
      this.pendingService.clear();
      this.pendingService.clearActiveDialog();
      this.router.navigate(['/customers']);
      if (isEdit && result) this.customerService.updateCustomer(result);
    });
  });

  routeState = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.getDeepestRouteState())
    ),
    { initialValue: { id: this.route.snapshot.paramMap.get('id'), isNew: false, isEdit: false } }
  );

  private getDeepestRouteState() {
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    const id = snapshot.paramMap.get('id');
    const isNew = snapshot.url.some(s => s.path === 'new');
    const isEdit = snapshot.url.some(s => s.path === 'edit');
    return { id, isNew, isEdit };
  }

  ngOnInit() {
    this.customerService.loadCustomers();
  }

  openViewDialog(customer: Customer) {
    const ref = this.dialog.open(CustomerDialog, {
      panelClass: ['customer-dialog', 'mode-view'],
      data: { mode: DialogMode.View, customer },
      closeOnNavigation: false,
    });

    this.activeDialogRef = ref as MatDialogRef<CustomerDialog>;
    this.pendingService.setActiveDialog(this.activeDialogRef);
    ref.afterClosed().subscribe(() => {
      this.activeDialogRef = null;
      this.pendingService.clearActiveDialog();
      this.pendingService.clear();
    });
    return ref as MatDialogRef<CustomerDialog>;
  }

  openEditDialog(customer: Customer) {
    const ref = this.dialog.open(CustomerDialog, {
      data: { mode: DialogMode.Edit, customer },
      panelClass: 'customer-dialog',
      closeOnNavigation: false,
    });

    this.activeDialogRef = ref as MatDialogRef<CustomerDialog>;
    this.pendingService.setActiveDialog(this.activeDialogRef);
    ref.afterClosed().subscribe(() => {
      this.activeDialogRef = null;
      this.pendingService.clearActiveDialog();
      this.pendingService.clear();
    });
    return ref as MatDialogRef<CustomerDialog>;
  }

  openAddDialog() {
    const ref = this.dialog.open(CustomerDialog, {
      data: { mode: DialogMode.Add },
      panelClass: 'customer-dialog',
      closeOnNavigation: false,
    });

    this.activeDialogRef = ref as MatDialogRef<CustomerDialog>;
    this.pendingService.setActiveDialog(this.activeDialogRef);
    ref.afterClosed().subscribe(() => {
      this.activeDialogRef = null;
      this.pendingService.clearActiveDialog();
      this.pendingService.clear();
    });
    return ref as MatDialogRef<CustomerDialog>;
  }

  // Called by router CanDeactivate guard
  canDeactivate(): boolean {
    if (!this.activeDialogRef) return true;
    const inst = this.activeDialogRef.componentInstance as {
      hasUnsavedChanges?: () => boolean;
      firstName?: { dirty?: boolean };
      lastName?: { dirty?: boolean };
      email?: { dirty?: boolean };
      isActive?: { dirty?: boolean };
    };
    if (!inst) return true;
    let unsaved = false;
    if (typeof inst.hasUnsavedChanges === 'function') {
      unsaved = inst.hasUnsavedChanges();
    } else {
      unsaved = !!(
        inst.firstName?.dirty ||
        inst.lastName?.dirty ||
        inst.email?.dirty ||
        inst.isActive?.dirty
      );
    }
    if (!unsaved) return true;
    const confirmLeave = window.confirm('You have unsaved changes. Leave without saving?');
    if (confirmLeave) {
      try {
        this.activeDialogRef.close();
      } catch {
        /* ignore */
      }
    }
    return confirmLeave;
  }

  viewCustomer(customer: Customer) {
    this.router.navigate(['/customers', customer.id]);
  }

  addCustomer() {
    this.router.navigate(['/customers/new']);
  }

  editCustomer() {
    if (this.selection.selected.length !== 1) return;
    this.router.navigate(['/customers', this.selection.selected[0].id, 'edit']);
  }

  deleteCustomers() {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete customers',
      message: 'Do you really want to delete these customers?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.customerService.deleteCustomers(this.selection.selected.map(r => r.id));

      this.selection.clear();
      this.changeDetectorRef.markForCheck();
    });
  }
}
