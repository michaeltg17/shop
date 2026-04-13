import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeSelector } from './theme-selector';

describe('ThemeSelector', () => {
  let component: ThemeSelector;
  let fixture: ComponentFixture<ThemeSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have themeService injected', () => {
    expect(component.themeService).toBeTruthy();
  });

  it('should have themeColors', () => {
    expect(component.themeColors).toBeDefined();
  });

  it('should have themeModes', () => {
    expect(component.themeModes).toBeDefined();
  });
});