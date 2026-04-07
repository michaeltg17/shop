import { Injectable } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Injectable({ providedIn: 'root' })
export class PendingChangesService {
  private _pending = false;
  private _activeDialog: MatDialogRef<unknown> | null = null;
  private _beforeUnloadHandler = (e: BeforeUnloadEvent) => {
    // Standard behavior: set returnValue to show the native confirmation dialog
    e.preventDefault();
    // Chrome requires setting returnValue to a non-empty string
    e.returnValue = '';
    return '';
  };

  setActiveDialog(ref: MatDialogRef<unknown> | null) {
    this._activeDialog = ref;
  }

  clearActiveDialog() {
    this._activeDialog = null;
  }

  setPending(v: boolean) {
    this._pending = v;
    if (v) {
      window.addEventListener('beforeunload', this._beforeUnloadHandler);
    } else {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
    }
  }

  clear() {
    this._pending = false;
    window.removeEventListener('beforeunload', this._beforeUnloadHandler);
  }

  isPending(): boolean {
    return this._pending;
  }

  // Called by the router guard to confirm navigation. If the user accepts,
  // clear the pending flag and close any open dialog that was registered.
  confirmNavigation(): boolean {
    console.log('[PendingChangesService] confirmNavigation called; pending=', this._pending);
    // If nothing pending, still close any registered dialog and allow navigation
    if (!this._pending) {
      try {
        this._activeDialog?.close();
      } catch {
        /* ignore */
      }
      this._activeDialog = null;
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      return true;
    }

    const ok = window.confirm('You have unsaved changes. Leave without saving?');
    console.log('[PendingChangesService] user response:', ok);
    if (ok) {
      this._pending = false;
      try {
        this._activeDialog?.close();
      } catch {
        /* ignore */
      }
      this._activeDialog = null;
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
    }
    return ok;
  }
}
