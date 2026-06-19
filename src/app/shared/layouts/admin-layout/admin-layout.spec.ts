import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLayout } from './admin-layout';
import { provideRouter, RouterModule } from '@angular/router';

describe('AdminLayout', () => {
  let component: AdminLayout;
  let fixture: ComponentFixture<AdminLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayout, RouterModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayout);
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
