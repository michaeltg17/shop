import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TitleService } from './core/services/title.service';
import { ActivatedRoute } from '@angular/router';

describe('App', () => {
  let component: App;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(App).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have titleService injected', () => {
    expect(component.titleService).toBeTruthy();
  });
});