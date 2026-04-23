import { Injectable, inject } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { PendingChangesService } from '../../services/pending-changes.service';

export interface CanComponentDeactivate {
  canDeactivate?: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({ providedIn: 'root' })
export class PendingChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  private pending = inject(PendingChangesService);

  canDeactivate(
    _component: CanComponentDeactivate
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Reference the unused parameter to satisfy strict-checks.
    void _component;
    // Delegate navigation confirmation to the PendingChangesService so
    // we don't rely on the component instance being available.
    return this.pending.confirmNavigation();
  }
}
