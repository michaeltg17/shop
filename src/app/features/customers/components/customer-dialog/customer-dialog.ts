import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Customer } from '../../customer';
import { DialogMode } from '../../../../core/models/dialogMode';

@Component({
  standalone: true,
  selector: 'app-customer-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  templateUrl: './customer-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDialog implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<CustomerDialog>);
  data = inject<{ mode: DialogMode; customer?: Customer }>(MAT_DIALOG_DATA);
  dialogMode = DialogMode;

  private _subs: { unsubscribe(): void }[] = [];
  private pendingService = inject(PendingChangesService);

  firstName = new FormControl(this.data.customer?.firstName ?? '', {
    nonNullable: true,
    validators: Validators.required,
  });

  lastName = new FormControl(this.data.customer?.lastName ?? '', {
    nonNullable: true,
    validators: Validators.required,
  });

  email = new FormControl(this.data.customer?.email ?? '', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  phoneNumber = new FormControl(this.data.customer?.phoneNumber ?? '', {
    nonNullable: true,
  });

  isActive = new FormControl(
    { value: this.data.customer?.isActive ?? true, disabled: this.data.mode === DialogMode.View },
    {
      nonNullable: true,
    }
  );

  ngOnInit() {
    if (this.data.mode === DialogMode.View) {
      this.firstName.disable();
      this.lastName.disable();
      this.email.disable();
      this.isActive.disable();
      this.phoneNumber.disable();
    }
    // Initially allow close; prevent when dirty
    this.dialogRef.disableClose = false;

    const markDisable = () => {
      const anyDirty =
        this.firstName.dirty || this.lastName.dirty || this.email.dirty || this.isActive.dirty;
      this.dialogRef.disableClose = anyDirty;
      this.pendingService.setPending(anyDirty);
    };

    // subscribe to value changes to update disableClose and pending state
    this._subs.push(this.firstName.valueChanges.subscribe(markDisable));
    this._subs.push(this.lastName.valueChanges.subscribe(markDisable));
    this._subs.push(this.email.valueChanges.subscribe(markDisable));
    this._subs.push(this.isActive.valueChanges.subscribe(markDisable));
  }

  isValid(): boolean {
    return this.firstName.valid && this.lastName.valid && this.email.valid;
  }

  save() {
    if (!this.isValid()) {
      return;
    }

    this.pendingService.clear();
    this.dialogRef.close({
      id: this.data.customer?.id ?? 0,
      firstName: this.firstName.value,
      lastName: this.lastName.value,
      email: this.email.value,
      isActive: this.isActive.value,
      phoneNumber: this.phoneNumber.value,
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this._subs.forEach(s => s.unsubscribe());
    this.pendingService.clear();
  }

  // Expose unsaved state for navigation guards
  hasUnsavedChanges(): boolean {
    return this.firstName.dirty || this.lastName.dirty || this.email.dirty || this.isActive.dirty;
  }
}
