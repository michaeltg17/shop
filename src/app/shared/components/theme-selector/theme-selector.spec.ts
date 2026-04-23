import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeSelector } from './theme-selector';
import { ThemeService } from '../../../core/services/theme.service';

describe('ThemeSelector', () => {
  let component: ThemeSelector;
  let fixture: ComponentFixture<ThemeSelector>;
  let themeServiceSpy: { loadTheme: jest.Mock; setColor: jest.Mock; setMode: jest.Mock };

  beforeEach(async () => {
    themeServiceSpy = {
      loadTheme: jest.fn(),
      setColor: jest.fn(),
      setMode: jest.fn(),
      currentTheme: { mode: 'light', color: 'blue' },
    };

    await TestBed.configureTestingModule({
      imports: [ThemeSelector],
      providers: [{ provide: ThemeService, useValue: themeServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have themeService injected', () => {
    expect(component.themeService).toBeTruthy();
  });

  it('should have themeColors', () => {
    expect(component.themeColors).toBeDefined();
    expect(component.themeColors.length).toBeGreaterThan(0);
  });

  it('should have themeModes', () => {
    expect(component.themeModes).toBeDefined();
    expect(component.themeModes.length).toBeGreaterThan(0);
  });

  it('should call themeService.loadTheme on init', () => {
    expect(themeServiceSpy.loadTheme).toHaveBeenCalled();
  });
});
