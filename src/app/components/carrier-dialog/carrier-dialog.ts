import {
  Component,
  Inject,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Carrier } from '../../models/carrier';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface CarrierDialogData {
  carrier?: Carrier;
}

@Component({
  selector: 'app-carrier-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './carrier-dialog.html',
  styleUrls: ['./carrier-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarrierDialog implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CarrierDialog>);
  @Inject(MAT_DIALOG_DATA) public data: CarrierDialogData;

  carrierForm!: FormGroup;
  isEditing = !!this.data.carrier;
  hasUnsavedChanges = signal(false);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.carrierForm = this.fb.group({
      name: [this.data.carrier?.name || '', Validators.required],
      trackingUrl: [this.data.carrier?.trackingUrl || '', Validators.required],
      isActive: [this.data.carrier?.isActive || true]
    });

    // Listen for form changes to track unsaved changes
    this.carrierForm.valueChanges.subscribe(() => {
      this.hasUnsavedChanges.set(true);
    });
  }

  onSubmit(): void {
    if (this.carrierForm.valid) {
      const formData = this.carrierForm.value;
      const carrierData: Carrier = {
        ...this.data.carrier,
        ...formData,
        id: this.data.carrier?.id || 0,
        createdAt: this.data.carrier?.createdAt || new Date(),
        updatedAt: new Date()
      };

      this.dialogRef.close(carrierData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  hasUnsavedChangesFn(): boolean {
    return this.hasUnsavedChanges();
  }
}