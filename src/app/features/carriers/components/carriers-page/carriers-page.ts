import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Carrier } from '../../carrier';
import { CarrierService } from '../../carrier.service';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmationDialog,
  ConfirmationDialogData,
} from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CarrierDialog } from '../carrier-dialog/carrier-dialog';
import { DialogMode } from '../../../../core/models/dialogMode';
import { BaseTableComponent, ColumnDef } from '../../../../shared/components/base-table/base-table';

@Component({
  selector: 'app-carriers-page',
  imports: [MatDialogModule, MatSnackBarModule, BaseTableComponent],
  templateUrl: './carriers-page.html',
  styleUrls: ['./carriers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarriersPage implements OnInit {
  private carrierService = inject(CarrierService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private changeDetectorRef = inject(ChangeDetectorRef);

  columns: ColumnDef[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'trackingUrl', label: 'Tracking URL' },
    { key: 'isActive', label: 'Active' },
    { key: 'createdAt', label: 'Created' },
    { key: 'updatedAt', label: 'Updated' },
  ];

  selection = new SelectionModel<Carrier>(true, []);
  dataSource = new MatTableDataSource<Carrier>();
  filterValue = '';

  loading = this.carrierService.loading;
  error = this.carrierService.error;
  carriers = this.carrierService.carriers;

  readonly errorEffect = effect(() => {
    const msg = this.error();
    if (msg) {
      this.snackBar.open(msg, 'Close', { duration: 4000 });
    }
  });

  readonly tableEffect = effect(() => {
    this.dataSource.data = this.carriers();
    this.changeDetectorRef.markForCheck();
  });

  ngOnInit() {
    this.carrierService.loadCarriers();
  }

  openAddDialog() {
    const ref = this.dialog.open(CarrierDialog, {
      data: { mode: DialogMode.Add, carrier: undefined },
      panelClass: 'carrier-dialog',
      closeOnNavigation: false,
    });
    ref.afterClosed().subscribe(carrier => {
      if (carrier) {
        this.carrierService.addCarrier(carrier);
        this.snackBar.open('Carrier added successfully', 'Close', { duration: 3000 });
      }
    });
  }

  openEditDialog(carrier: Carrier) {
    const ref = this.dialog.open(CarrierDialog, {
      data: { mode: DialogMode.Edit, carrier },
      panelClass: 'carrier-dialog',
      closeOnNavigation: false,
    });
    ref.afterClosed().subscribe(updatedCarrier => {
      if (updatedCarrier) {
        this.carrierService.updateCarrier(updatedCarrier);
        this.snackBar.open('Carrier updated successfully', 'Close', { duration: 3000 });
      }
    });
  }

  editCarrier() {
    if (this.selection.selected.length !== 1) return;
    this.openEditDialog(this.selection.selected[0]);
  }

  deleteCarriers() {
    if (this.selection.selected.length === 0) return;

    const dialogData: ConfirmationDialogData = {
      title: 'Delete carriers',
      message: `Do you really want to delete ${this.selection.selected.length} carrier(s)?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.selection.selected.forEach(carrier => this.carrierService.deleteCarrier(carrier.id));

      this.selection.clear();
      this.changeDetectorRef.markForCheck();
    });
  }
}
