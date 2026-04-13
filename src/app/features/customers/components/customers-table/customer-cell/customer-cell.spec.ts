import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerCell } from './customer-cell';

describe('CustomerCell', () => {
  let component: CustomerCell;
  let fixture: ComponentFixture<CustomerCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCell],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize value to null', () => {
    expect(component.value).toBeNull();
  });

  it('should set value to string', () => {
    component.value = 'test';
    expect(component.value).toBe('test');
  });

  it('should set value to boolean', () => {
    component.value = true;
    expect(component.value).toBe(true);
  });

  it('should set value to number', () => {
    component.value = 42;
    expect(component.value).toBe(42);
  });
});