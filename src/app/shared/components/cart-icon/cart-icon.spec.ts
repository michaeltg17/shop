import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartIcon } from './cart-icon';
import { ActivatedRoute } from '@angular/router';

describe('CartIcon', () => {
  let component: CartIcon;
  let fixture: ComponentFixture<CartIcon>;

  beforeEach(async () => {
    // Clear localStorage before each test to ensure test isolation
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CartIcon],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartIcon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clear localStorage after each test to prevent state leakage
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize cartItemCount to 0', () => {
    expect(component.cartItemCount).toBe(0);
  });

  it('should load cart count from localStorage', () => {
    localStorage.clear();
    localStorage.setItem('shoppingCart', JSON.stringify([{ quantity: 2 }, { quantity: 3 }]));
    component.loadCartCount();
    expect(component.cartItemCount).toBe(5);
  });

  it('should set cartItemCount to 0 when no cart data exists', () => {
    localStorage.clear();
    localStorage.removeItem('shoppingCart');
    component.loadCartCount();
    expect(component.cartItemCount).toBe(0);
  });

  it('should set cartItemCount to 0 on parse error', () => {
    localStorage.clear();
    localStorage.setItem('shoppingCart', 'invalid json');
    component.loadCartCount();
    expect(component.cartItemCount).toBe(0);
  });

  it('should add storage event listener on init', () => {
    localStorage.clear();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const comp = new CartIcon();
    comp.ngOnInit();
    expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  it('should remove storage event listener on destroy', () => {
    localStorage.clear();
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const comp = new CartIcon();
    comp.ngOnInit();
    comp.ngOnDestroy();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('should handle empty array in localStorage', () => {
    localStorage.clear();
    localStorage.setItem('shoppingCart', JSON.stringify([]));
    component.loadCartCount();
    expect(component.cartItemCount).toBe(0);
  });

  it('should load cart count on init via ngOnInit', () => {
    localStorage.clear();
    localStorage.setItem('shoppingCart', JSON.stringify([{ quantity: 4 }]));
    const comp = new CartIcon();
    comp.ngOnInit();
    expect(comp.cartItemCount).toBe(4);
  });

  it('should update cartItemCount when storage event fires', () => {
    localStorage.clear();
    const comp = new CartIcon();
    comp.ngOnInit();
    expect(comp.cartItemCount).toBe(0);

    // Simulate storage change in another tab
    localStorage.setItem('shoppingCart', JSON.stringify([{ quantity: 3 }, { quantity: 2 }]));
    window.dispatchEvent(new Event('storage'));
    expect(comp.cartItemCount).toBe(5);

    comp.ngOnDestroy();
  });
});
