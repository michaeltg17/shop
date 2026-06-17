import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BaseTableComponent, ColumnDef } from './base-table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { Component, ViewChild } from '@angular/core';

interface TestRow {
  id: number;
  name: string;
}

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [BaseTableComponent],
  template: `
    <app-base-table
      #table
      [columns]="columns"
      [dataSource]="dataSource"
      [selection]="selection"
      [filterValue]="filterValue"
      (add)="onAdd()"
      (edit)="onEdit()"
      (delete)="onDelete()"
      (filterChange)="onFilterChange($event)"
      (rowClick)="onRowClick($event)"
    >
    </app-base-table>
  `,
})
class TestHostComponent {
  @ViewChild('table') baseTable!: BaseTableComponent<TestRow>;

  columns: ColumnDef[] = [];
  dataSource = new MatTableDataSource<TestRow>();
  selection = new SelectionModel<TestRow>(true, []);
  filterValue = '';

  onAdd = jest.fn();
  onEdit = jest.fn();
  onDelete = jest.fn();
  onFilterChange = jest.fn();
  onRowClick = jest.fn();
}

describe('BaseTableComponent', () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let baseTable: BaseTableComponent<TestRow>;

  const mockColumns: ColumnDef[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    host.columns = mockColumns;
    fixture.detectChanges();
    baseTable = host.baseTable;
  });

  it('should create', () => {
    expect(baseTable).toBeTruthy();
  });

  it('should have displayed columns including select', () => {
    expect(baseTable.displayedColumns()).toContain('select');
    expect(baseTable.displayedColumns()).toContain('id');
    expect(baseTable.displayedColumns()).toContain('name');
  });

  it('should apply filter with trim and lowercase', () => {
    baseTable.onFilterChange({ target: { value: '  TEST  ' } } as unknown as Event);
    expect(baseTable.dataSource().filter).toBe('test');
  });

  it('should handle filter with empty string', () => {
    baseTable.onFilterChange({ target: { value: '' } } as unknown as Event);
    expect(baseTable.dataSource().filter).toBe('');
  });

  it('should handle filter with whitespace only', () => {
    baseTable.onFilterChange({ target: { value: '   ' } } as unknown as Event);
    expect(baseTable.dataSource().filter).toBe('');
  });

  it('should handle filter with null target', () => {
    const event = new Event('input');
    Object.defineProperty(event, 'target', { get: () => null });
    baseTable.onFilterChange(event);
    expect(baseTable.dataSource().filter).toBe('');
  });

  it('should handle filter with undefined value', () => {
    baseTable.onFilterChange({ target: { value: undefined } } as unknown as Event);
    expect(baseTable.dataSource().filter).toBe('');
  });

  it('should emit filterChange when filter changes', () => {
    baseTable.onFilterChange({ target: { value: 'hello' } } as unknown as Event);
    expect(host.onFilterChange).toHaveBeenCalledWith('hello');
  });

  it('should set dataSource.filter when applying filter', () => {
    baseTable.onFilterChange({ target: { value: 'test' } } as unknown as Event);
    expect(baseTable.dataSource().filter).toBe('test');
  });

  it('should return true when all rows are selected', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);
    host.selection = selection;
    host.dataSource = dataSource;
    selection.select(rows[0]);
    fixture.detectChanges();
    expect(baseTable.isAllSelected()).toBe(true);
  });

  it('should return false when not all rows are selected', () => {
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);
    host.selection = selection;
    host.dataSource = dataSource;
    selection.select(rows[0]);
    fixture.detectChanges();
    expect(baseTable.isAllSelected()).toBe(false);
  });

  it('should return true for isAllSelected with empty data', () => {
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>([]);
    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    expect(baseTable.isAllSelected()).toBe(true);
  });

  it('should toggle all rows - select all', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);
    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    baseTable.toggleAllRows();
    expect(selection.selected.length).toBe(1);
  });

  it('should toggle all rows - deselect all', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);
    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    selection.select(rows[0]);
    fixture.detectChanges();
    baseTable.toggleAllRows();
    expect(selection.selected.length).toBe(0);
  });

  it('should toggle all rows - multiple rows', () => {
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);
    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    baseTable.toggleAllRows();
    expect(selection.selected.length).toBe(3);
    baseTable.toggleAllRows();
    expect(selection.selected.length).toBe(0);
  });

  it('should emit add when add event is triggered', () => {
    baseTable.add.emit();
    expect(host.onAdd).toHaveBeenCalled();
  });

  it('should emit edit only when exactly one row is selected', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);

    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    baseTable.onEdit();
    expect(host.onEdit).not.toHaveBeenCalled();

    selection.select(rows[0]);
    fixture.detectChanges();
    baseTable.onEdit();
    expect(host.onEdit).toHaveBeenCalledTimes(1);
  });

  it('should not emit edit when multiple rows are selected', () => {
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);
    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    selection.select(rows[0], rows[1]);
    fixture.detectChanges();
    baseTable.onEdit();
    expect(host.onEdit).not.toHaveBeenCalled();
  });

  it('should emit delete only when at least one row is selected', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);

    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    baseTable.onDelete();
    expect(host.onDelete).not.toHaveBeenCalled();

    selection.select(rows[0]);
    fixture.detectChanges();
    baseTable.onDelete();
    expect(host.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should emit delete when multiple rows are selected', () => {
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    const selection = new SelectionModel<TestRow>(true, []);
    const dataSource = new MatTableDataSource<TestRow>(rows);
    host.selection = selection;
    host.dataSource = dataSource;
    fixture.detectChanges();
    selection.select(rows[0], rows[1]);
    fixture.detectChanges();
    baseTable.onDelete();
    expect(host.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should emit rowClick with the clicked row', () => {
    const row = { id: 1, name: 'A' };
    baseTable.rowClick.emit(row);
    expect(host.onRowClick).toHaveBeenCalledWith(row);
  });

  it('should have default button labels', () => {
    expect(baseTable.addButtonLabel()).toBe('Add');
    expect(baseTable.editButtonLabel()).toBe('Edit');
    expect(baseTable.deleteButtonLabel()).toBe('Delete');
  });

  it('should have default disabled state as false', () => {
    expect(baseTable.addButtonDisabled()).toBe(false);
    expect(baseTable.editButtonDisabled()).toBe(false);
    expect(baseTable.deleteButtonDisabled()).toBe(false);
  });

  it('should use default pageSizeOptions', () => {
    expect(baseTable.pageSizeOptions()).toEqual([5, 10, 25, 50]);
  });

  it('should use default icons when not specified', () => {
    expect(baseTable.addIcon()).toBeNull();
    expect(baseTable.editIcon()).toBeNull();
    expect(baseTable.deleteIcon()).toBeNull();
  });

  it('should display columns in correct order with select first', () => {
    const cols = baseTable.displayedColumns();
    expect(cols[0]).toBe('select');
    expect(cols[1]).toBe('id');
    expect(cols[2]).toBe('name');
  });

  it('should update displayedColumns when columns change', () => {
    host.columns = [{ key: 'x', label: 'X' }];
    fixture.detectChanges();
    expect(baseTable.displayedColumns()).toEqual(['select', 'x']);
  });

  it('should handle empty columns', () => {
    host.columns = [];
    fixture.detectChanges();
    expect(baseTable.displayedColumns()).toEqual(['select']);
  });
});
