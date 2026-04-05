import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  signal
} from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Carrier } from '../../models/carrier';
import { CarrierService } from '../../services/carrier.service';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CarrierDialog, CarrierDialogData } from '../carrier-dialog/carrier-dialog';
import { ConfirmationDialog, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-carriers-page',
  imports: [
    MatTableModule,
    MatSnackBarModule,
    MatSortModule,
    MatPaginatorModule,
    FormsModule,
    DragDropModule,
    MatCheckboxModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatToolbarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './carriers-page.html',
  styleUrls: ['./carriers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarriersPage implements OnInit, AfterViewInit {
  private carrierService = inject(CarrierService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private changeDetectorRef = inject(ChangeDetectorRef);

  columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'trackingUrl', label: 'Tracking URL' },
    { key: 'isActive', label: 'Active' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' }
  ];
  displayedColumns = ['select', ...this.columns.map(c => c.key)];
  selection = new SelectionModel<Carrier>(true, []);
  dataSource = new MatTableDataSource<Carrier>();
  filterValue = '';
  private dialogOpen = signal(false);
  private activeDialogRef: MatDialogRef<CarrierDialog> | null = null;

  carriers = this.carrierService.carriers;
  loading = this.carrierService.loading;
  error = this.carrierService.error;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly errorEffect = effect(() => {
    const msg = this.error();
    if (msg) {
      this.snackBar.open(msg, 'Close', { duration: 4000 });
    }
  });

  readonly tableEffect = effect(() => {
    this.dataSource.data = this.carriers();
    this.applyFilter(this.filterValue);
    this.changeDetectorRef.markForCheck();
  });

  ngOnInit() {
    this.carrierService.loadCarriers();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(value: string) {
    this.filterValue = value.trim().toLowerCase();
    this.dataSource.filter = this.filterValue;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  openAddDialog() {
    const ref = this.dialog.open(CarrierDialog, {
      data: { carrier: undefined },
      panelClass: 'carrier-dialog',
      closeOnNavigation: false
    });

    this.activeDialogRef = ref as MatDialogRef<CarrierDialog>;
    ref.afterClosed().subscribe((result: Carrier | undefined) => {
      this.activeDialogRef = null;
      if (result) {
        this.carrierService.addCarrier(result);
        this.snackBar.open('Carrier added successfully', 'Close', { duration: 3000 });
      }
    });
    return ref as MatDialogRef<CarrierDialog>;
  }

  openEditDialog(carrier: Carrier) {
    const ref = this.dialog.open(CarrierDialog, {
      data: { carrier },
      panelClass: 'carrier-dialog',
      closeOnNavigation: false
    });

    this.activeDialogRef = ref as MatDialogRef<CarrierDialog>;
    ref.afterClosed().subscribe((result: Carrier | undefined) => {
      this.activeDialogRef = null;
      if (result) {
        this.carrierService.updateCarrier(result);
        this.snackBar.open('Carrier updated successfully', 'Close', { duration: 3000 });
      }
    });
    return ref as MatDialogRef<CarrierDialog>;
  }

  addCarrier() {
    this.openAddDialog();
  }

  editCarrier() {
    if (this.selection.selected.length !== 1) return;
    this.openEditDialog(this.selection.selected[0]);
  }

  deleteCarriers() {
    if (this.selection.selected.length === 0) return;

    const dialogData: ConfirmationDialogData = {
      title: 'Delete Carriers',
      message: `Do you really want to delete ${this.selection.selected.length} carrier(s)?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.selection.selected.forEach(carrier => {
        this.carrierService.deleteCarrier(carrier.id);
      });

      this.selection.clear();
      this.snackBar.open(`${this.selection.selected.length} carrier(s) deleted successfully`, 'Close', { duration: 3000 });
      this.changeDetectorRef.markForCheck();
    });
  }
}