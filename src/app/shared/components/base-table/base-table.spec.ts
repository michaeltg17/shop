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
    component.onFilterChange({ target: { value: '  TEST  ' } });
    expect(component.filterValue).toBe('test');
  });

  it('should handle filter with missing target', () => {
    component.onFilterChange({} as Event);
    expect(component.filterValue).toBe('');
    expect(component.dataSource.filter).toBe('');
  });

  it('should emit filterChange when filter changes', () => {
    const spy = jest.spyOn(component.filterChange, 'emit');
    component.onFilterChange({ target: { value: 'hello' } });
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('should set dataSource.filter when applying filter', () => {
    component.onFilterChange({ target: { value: 'test' } });
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

  it('should emit rowClick with the clicked row', () => {
    const spy = jest.spyOn(component.rowClick, 'emit');
    const row = { id: 1, name: 'A' };
    component.rowClick.emit(row);
    expect(spy).toHaveBeenCalledWith(row);
  });
});
