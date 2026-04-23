import { TestBed } from '@angular/core/testing';
import { PendingChangesGuard, CanComponentDeactivate } from './pending-changes.guard';
import { PendingChangesService } from '../../services/pending-changes.service';

describe('PendingChangesGuard', () => {
  let guard: PendingChangesGuard;
  let pendingService: PendingChangesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PendingChangesGuard,
        {
          provide: PendingChangesService,
          useValue: {
            confirmNavigation: jest.fn().mockReturnValue(true),
          },
        },
      ],
    });

    guard = TestBed.inject(PendingChangesGuard);
    pendingService = TestBed.inject(PendingChangesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should delegate canDeactivate to PendingChangesService.confirmNavigation', () => {
    const mockComponent = {} as CanComponentDeactivate;

    const result = guard.canDeactivate(mockComponent);

    expect(result).toBe(true);
    expect(pendingService.confirmNavigation).toHaveBeenCalled();
  });

  it('should return false when service returns false', () => {
    (pendingService.confirmNavigation as jest.Mock).mockReturnValue(false);

    const mockComponent = {} as CanComponentDeactivate;
    const result = guard.canDeactivate(mockComponent);

    expect(result).toBe(false);
  });
});
