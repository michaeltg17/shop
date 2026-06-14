import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseTableComponent, ColumnDef } from './base-table';
import { SelectionModel } from '@angular/cdk/collections';

interface TestRow {
  id: number;
  name: string;
}

describe('BaseTableComponent', () => {
  let component: BaseTableComponent<TestRow>;
  let fixture: ComponentFixture<BaseTableComponent<TestRow>>;

  const mockColumns: ColumnDef[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseTableComponent);
    component = fixture.componentInstance;
    component.columns = () => mockColumns;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have displayed columns including select', () => {
    expect(component.displayedColumns()).toContain('select');
    expect(component.displayedColumns()).toContain('id');
    expect(component.displayedColumns()).toContain('name');
  });

  it('should apply filter with trim and lowercase', () => {
    component.onFilterChange({ target: { value: '  TEST  ' } } as unknown as Event);
    expect(component.filterValue).toBe('test');
  });

  it('should handle filter with empty string', () => {
    component.onFilterChange({ target: { value: '' } } as unknown as Event);
    expect(component.filterValue).toBe('');
    expect(component.dataSource.filter).toBe('');
  });

  it('should handle filter with whitespace only', () => {
    component.onFilterChange({ target: { value: '   ' } } as unknown as Event);
    expect(component.filterValue).toBe('');
  });

  it('should handle filter with null target', () => {
    const event = new Event('input');
    // Simulate null target
    Object.defineProperty(event, 'target', { get: () => null });
    component.onFilterChange(event);
    expect(component.filterValue).toBe('');
  });

  it('should handle filter with undefined value', () => {
    component.onFilterChange({ target: { value: undefined } } as unknown as Event);
    expect(component.filterValue).toBe('');
  });

  it('should emit filterChange when filter changes', () => {
    const spy = jest.spyOn(component.filterChange, 'emit');
    component.onFilterChange({ target: { value: 'hello' } } as unknown as Event);
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('should set dataSource.filter when applying filter', () => {
    component.onFilterChange({ target: { value: 'test' } } as unknown as Event);
    expect(component.dataSource.filter).toBe('test');
  });

  it('should return true when all rows are selected', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = rows;
    component.selection.select(rows[0]);
    expect(component.isAllSelected()).toBe(true);
  });

  it('should return false when not all rows are selected', () => {
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = rows;
    component.selection.select(rows[0]);
    expect(component.isAllSelected()).toBe(false);
  });

  it('should return true for isAllSelected with empty data', () => {
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = [];
    expect(component.isAllSelected()).toBe(true);
  });

  it('should toggle all rows - select all', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = rows;
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(1);
  });

  it('should toggle all rows - deselect all', () => {
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = rows;
    component.selection.select(rows[0]);
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should toggle all rows - multiple rows', () => {
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
    ];
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = rows;
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(3);
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should emit add when add event is triggered', () => {
    const spy = jest.spyOn(component.add, 'emit');
    component.add.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit edit only when exactly one row is selected', () => {
    const spy = jest.spyOn(component.edit, 'emit');
    component.selection = new SelectionModel<TestRow>(true, []);

    // no selection
    component.onEdit();
    expect(spy).not.toHaveBeenCalled();

    // one selection
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    component.dataSource.data = rows;
    component.selection.select(rows[0]);
    component.onEdit();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not emit edit when multiple rows are selected', () => {
    const spy = jest.spyOn(component.edit, 'emit');
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = rows;
    component.selection.select(rows[0], rows[1]);
    component.onEdit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit delete only when at least one row is selected', () => {
    const spy = jest.spyOn(component.delete, 'emit');
    component.selection = new SelectionModel<TestRow>(true, []);

    // no selection
    component.onDelete();
    expect(spy).not.toHaveBeenCalled();

    // one selection
    const rows: TestRow[] = [{ id: 1, name: 'A' }];
    component.dataSource.data = rows;
    component.selection.select(rows[0]);
    component.onDelete();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit delete when multiple rows are selected', () => {
    const spy = jest.spyOn(component.delete, 'emit');
    const rows: TestRow[] = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    component.selection = new SelectionModel<TestRow>(true, []);
    component.dataSource.data = rows;
    component.selection.select(rows[0], rows[1]);
    component.onDelete();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit rowClick with the clicked row', () => {
    const spy = jest.spyOn(component.rowClick, 'emit');
    const row = { id: 1, name: 'A' };
    component.rowClick.emit(row);
    expect(spy).toHaveBeenCalledWith(row);
  });

  it('should have default button labels', () => {
    expect(component.addButtonLabel).toBe('Add');
    expect(component.editButtonLabel).toBe('Edit');
    expect(component.deleteButtonLabel).toBe('Delete');
  });

  it('should have default disabled state as false', () => {
    expect(component.addButtonDisabled).toBe(false);
    expect(component.editButtonDisabled).toBe(false);
    expect(component.deleteButtonDisabled).toBe(false);
  });

  it('should use default pageSizeOptions', () => {
    expect(component.pageSizeOptions()).toEqual([5, 10, 25, 50]);
  });

  it('should use default icons when not specified', () => {
    expect(component.addIcon).toBeNull();
    expect(component.editIcon).toBeNull();
    expect(component.deleteIcon).toBeNull();
  });

  it('should display columns in correct order with select first', () => {
    const cols = component.displayedColumns();
    expect(cols[0]).toBe('select');
    expect(cols[1]).toBe('id');
    expect(cols[2]).toBe('name');
  });

  it('should update displayedColumns when columns change', () => {
    component.columns = () => [{ key: 'x', label: 'X' }];
    expect(component.displayedColumns()).toEqual(['select', 'x']);
  });

  it('should handle empty columns', () => {
    component.columns = () => [];
    expect(component.displayedColumns()).toEqual(['select']);
  });
});
