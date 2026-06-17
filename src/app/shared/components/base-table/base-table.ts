import {
  Component,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { TemplateRef } from '@angular/core';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface ColumnDef {
  key: string;
  label: string;
}

/**
 * Shared base table component with:
 * - search / filter input
 * - add / edit / delete action buttons (icon buttons)
 * - multi-row selection via checkboxes
 * - sort-able columns
 * - pagination
 * - dynamic column definitions
 *
 * Cell rendering is delegated to a consumer-supplied TemplateRef via the
 * `cellTemplate` input, receiving `{ $implicit: row, column: ColumnDef }` context.
 * If no cellTemplate is supplied, falls back to plain `{{ row[col.key] }}`.
 */
@Component({
  selector: 'app-base-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './base-table.html',
  styleUrl: './base-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseTableComponent<T> implements AfterViewInit {
  // --- inputs (Angular 21 signal-based) ---
  readonly columns = input<ColumnDef[]>([]);
  readonly dataSource = input<MatTableDataSource<T>>(new MatTableDataSource());
  readonly selection = input<SelectionModel<T>>(new SelectionModel<T>(true, []));
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly filterValue = input('');
  readonly addIcon = input<string | null>(null);
  readonly editIcon = input<string | null>(null);
  readonly deleteIcon = input<string | null>(null);
  readonly addButtonLabel = input('Add');
  readonly editButtonLabel = input('Edit');
  readonly deleteButtonLabel = input('Delete');
  readonly addButtonDisabled = input(false);
  readonly editButtonDisabled = input(false);
  readonly deleteButtonDisabled = input(false);
  readonly cellTemplate = input<TemplateRef<unknown> | null>(null);

  // --- outputs (Angular 21 signal-based) ---
  readonly add = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();
  readonly filterChange = output<string>();
  readonly rowClick = output<T>();

  // --- view children ---
  @ViewChild(MatTable) table!: MatTable<T>;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = computed(() => ['select', ...this.columns().map(c => c.key)]);

  isAllSelected(): boolean {
    const numSelected = this.selection().selected.length;
    const numRows = this.dataSource().data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection().clear();
    } else {
      this.dataSource().data.forEach(row => this.selection().select(row));
    }
  }

  ngAfterViewInit(): void {
    this.dataSource().sort = this.sort;
    this.dataSource().paginator = this.paginator;
  }

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.dataSource().filter = value.trim().toLowerCase();
    this.filterChange.emit(value.trim().toLowerCase());
  }

  onEdit(): void {
    if (this.selection().selected.length !== 1) return;
    this.edit.emit();
  }

  onDelete(): void {
    if (this.selection().selected.length === 0) return;
    this.delete.emit();
  }
}
