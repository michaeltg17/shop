import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCell } from './user-cell';

describe('UserCell', () => {
  let component: UserCell;
  let fixture: ComponentFixture<UserCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCell],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCell);
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
