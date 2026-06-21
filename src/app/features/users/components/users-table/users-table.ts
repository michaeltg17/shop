import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../../user';
import { UserService } from '../../user.service';
import { UserCell } from './user-cell/user-cell';
import { SelectionModel } from '@angular/cdk/collections';
import {
  ConfirmationDialog,
  ConfirmationDialogData,
} from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserDialog } from '../user-dialog/user-dialog';
import { DialogMode } from '../../../../core/models/dialogMode';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { BaseTableComponent, ColumnDef } from '../../../../shared/components/base-table/base-table';

@Component({
  selector: 'app-users-table',
  imports: [MatSnackBarModule, UserCell, MatDialogModule, BaseTableComponent],
  templateUrl: './users-table.html',
  styleUrls: ['./users-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTable implements OnInit {
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pendingService = inject(PendingChangesService);

  columns: ColumnDef[] = [
    { key: 'id', label: 'Id' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'isActive', label: 'Active' },
  ];

  selection = new SelectionModel<User>(true, []);
  dataSource = new MatTableDataSource<User>();
  filterValue = '';
  private dialogOpen = signal(false);
  private activeDialogRef: MatDialogRef<UserDialog> | null = null;

  users = this.userService.users;
  loading = this.userService.loading;
  error = this.userService.error;

  readonly errorEffect = effect(() => {
    const msg = this.error();
    if (msg) {
      this.snackBar.open(msg, 'Close', { duration: 4000 });
    }
  });

  readonly tableEffect = effect(() => {
    this.dataSource.data = this.users();
    this.changeDetectorRef.markForCheck();
  });

  readonly routeEffect = effect(() => {
    const rs = this.routeState();
    const users = this.users();

    if (untracked(() => this.dialogOpen())) return;

    const { id, isNew, isEdit } = rs;

    if (!users.length) return;

    if (isNew) {
      this.dialogOpen.set(true);
      const ref = this.openAddDialog();
      ref.afterClosed().subscribe(result => {
        this.pendingService.clear();
        this.pendingService.clearActiveDialog();
        this.router.navigate(['../'], { relativeTo: this.route }).then(() => {
          this.dialogOpen.set(false);
          if (result) this.userService.addUser(result);
        });
      });
      return;
    }

    if (!id) return;

    const user = users.find(u => u.id === +id);
    if (!user) return;

    this.dialogOpen.set(true);
    const ref = isEdit ? this.openEditDialog(user) : this.openViewDialog(user);
    ref.afterClosed().subscribe(result => {
      this.pendingService.clear();
      this.pendingService.clearActiveDialog();
      this.router.navigate(['../'], { relativeTo: this.route }).then(() => {
        this.dialogOpen.set(false);
        if (isEdit && result) this.userService.updateUser(result);
      });
    });
  });

  routeState = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.getDeepestRouteState())
    ),
    { initialValue: { id: this.route.snapshot.paramMap.get('id'), isNew: false, isEdit: false } }
  );

  private getDeepestRouteState() {
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }

    const id = snapshot.paramMap.get('id');
    const isNew = snapshot.url.some(s => s.path === 'new');
    const isEdit = snapshot.url.some(s => s.path === 'edit');
    return { id, isNew, isEdit };
  }

  ngOnInit() {
    this.userService.loadUsers();
  }

  openViewDialog(user: User) {
    const ref = this.dialog.open(UserDialog, {
      panelClass: ['user-dialog', 'mode-view'],
      data: { mode: DialogMode.View, user },
      closeOnNavigation: false,
    });

    this.activeDialogRef = ref as MatDialogRef<UserDialog>;
    this.pendingService.setActiveDialog(this.activeDialogRef);
    ref.afterClosed().subscribe(() => {
      this.activeDialogRef = null;
      this.pendingService.clearActiveDialog();
      this.pendingService.clear();
    });
    return ref as MatDialogRef<UserDialog>;
  }

  openEditDialog(user: User) {
    const ref = this.dialog.open(UserDialog, {
      data: { mode: DialogMode.Edit, user },
      panelClass: 'user-dialog',
      closeOnNavigation: false,
    });

    this.activeDialogRef = ref as MatDialogRef<UserDialog>;
    this.pendingService.setActiveDialog(this.activeDialogRef);
    ref.afterClosed().subscribe(() => {
      this.activeDialogRef = null;
      this.pendingService.clearActiveDialog();
      this.pendingService.clear();
    });
    return ref as MatDialogRef<UserDialog>;
  }

  openAddDialog() {
    const ref = this.dialog.open(UserDialog, {
      data: { mode: DialogMode.Add },
      panelClass: 'user-dialog',
      closeOnNavigation: false,
    });

    this.activeDialogRef = ref as MatDialogRef<UserDialog>;
    this.pendingService.setActiveDialog(this.activeDialogRef);
    ref.afterClosed().subscribe(() => {
      this.activeDialogRef = null;
      this.pendingService.clearActiveDialog();
      this.pendingService.clear();
    });
    return ref as MatDialogRef<UserDialog>;
  }

  // Called by router CanDeactivate guard
  canDeactivate(): boolean {
    if (!this.activeDialogRef) return true;
    const inst = this.activeDialogRef.componentInstance as {
      hasUnsavedChanges?: () => boolean;
      firstName?: { dirty?: boolean };
      lastName?: { dirty?: boolean };
      email?: { dirty?: boolean };
      isActive?: { dirty?: boolean };
    };
    if (!inst) return true;
    let unsaved = false;
    if (typeof inst.hasUnsavedChanges === 'function') {
      unsaved = inst.hasUnsavedChanges();
    } else {
      unsaved = !!(
        inst.firstName?.dirty ||
        inst.lastName?.dirty ||
        inst.email?.dirty ||
        inst.isActive?.dirty
      );
    }
    if (!unsaved) return true;
    const confirmLeave = window.confirm('You have unsaved changes. Leave without saving?');
    if (confirmLeave) {
      try {
        this.activeDialogRef.close();
      } catch {
        /* ignore */
      }
    }
    return confirmLeave;
  }

  viewUser(user: User) {
    this.router.navigate([user.id], { relativeTo: this.route });
  }

  addUser() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  editUser() {
    if (this.selection.selected.length !== 1) return;
    this.router.navigate([this.selection.selected[0].id, 'edit'], { relativeTo: this.route });
  }

  deleteUsers() {
    const dialogData: ConfirmationDialogData = {
      title: 'Delete users',
      message: 'Do you really want to delete these users?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.userService.deleteUsers(this.selection.selected.map(r => r.id));

      this.selection.clear();
      this.changeDetectorRef.markForCheck();
    });
  }
}
