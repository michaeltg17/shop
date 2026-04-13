import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartIcon } from './cart-icon';
import { ActivatedRoute } from '@angular/router';

describe('CartIcon', () => {
  let component: CartIcon;
  let fixture: ComponentFixture<CartIcon>;

  beforeEach(async () => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize cartItemCount to 0', () => {
    expect(component.cartItemCount).toBe(0);
  });

  it('should load cart count from localStorage', () => {
    localStorage.setItem('shoppingCart', JSON.stringify([{ quantity: 2 }, { quantity: 3 }]));
    component.loadCartCount();
    expect(component.cartItemCount).toBe(5);
  });

  it('should set cartItemCount to 0 when no cart data exists', () => {
    localStorage.removeItem('shoppingCart');
    component.loadCartCount();
    expect(component.cartItemCount).toBe(0);
  });

  it('should set cartItemCount to 0 on parse error', () => {
    localStorage.setItem('shoppingCart', 'invalid json');
    component.loadCartCount();
    expect(component.cartItemCount).toBe(0);
  });
});