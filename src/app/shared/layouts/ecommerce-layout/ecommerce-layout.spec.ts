import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EcommerceLayout } from './ecommerce-layout';
import { provideRouter, RouterModule } from '@angular/router';

describe('EcommerceLayout', () => {
  let component: EcommerceLayout;
  let fixture: ComponentFixture<EcommerceLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcommerceLayout, RouterModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EcommerceLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject TitleService', () => {
    expect(component.titleService).toBeTruthy();
  });
});
