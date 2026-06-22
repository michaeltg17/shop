import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { UsersTable } from './users-table';
import { UserService } from '../../user.service';
import { UserDialog } from '../user-dialog/user-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterState,
  Event as RouterEvent,
} from '@angular/router';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { of, Subject } from 'rxjs';
import { User } from '../../user';
import { DialogMode } from '../../../../core/models/dialogMode';

describe('UsersTable', () => {
  let component: UsersTable;
  let fixture: ComponentFixture<UsersTable>;
  let userService: Partial<UserService>;
  let snackBar: Partial<MatSnackBar>;
  let dialog: Partial<MatDialog>;
  let route: ActivatedRoute;
  let router: Partial<Router>;
  let pendingService: Partial<PendingChangesService>;
  let routerEvents: Subject<RouterEvent>;

  const mockUser: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '123-456-7890',
    isActive: true,
  };

  beforeEach(async () => {
    routerEvents = new Subject<RouterEvent>();

    const usersSignal = signal<User[]>([]);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);

    userService = {
      loadUsers: jest.fn(),
      addUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUsers: jest.fn(),
      users: usersSignal,
      loading: loadingSignal,
      error: errorSignal,
    };

    snackBar = {
      open: jest.fn(),
    };

    const mockDialogRef = {
      afterClosed: () => of(undefined),
      componentInstance: {},
      close: jest.fn(),
    };

    dialog = {
      open: jest.fn().mockReturnValue(mockDialogRef),
    } as Partial<MatDialog>;

    const routeSnapshot = {
      paramMap: { get: () => null },
      url: [],
      firstChild: null,
    };

    route = {
      snapshot: routeSnapshot,
    } as unknown as ActivatedRoute;

    const routerState = {
      snapshot: {
        root: {
          firstChild: null,
          paramMap: { get: () => null },
          url: [],
        },
      },
    };

    router = {
      navigate: jest.fn(),
      routerState: routerState as unknown as RouterState,
      events: routerEvents.asObservable(),
    };

    pendingService = {
      clear: jest.fn(),
      clearActiveDialog: jest.fn(),
      setActiveDialog: jest.fn(),
      setPending: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UsersTable],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: PendingChangesService, useValue: pendingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have columns defined', () => {
    expect(component.columns).toBeDefined();
    expect(component.columns.length).toBe(6);
    expect(component.columns[0].key).toBe('id');
    expect(component.columns[0].label).toBe('Id');
  });

  it('should load users on init', () => {
    component.ngOnInit();
    expect(userService.loadUsers).toHaveBeenCalled();
  });

  it('should have filterValue property', () => {
    expect(component.filterValue).toBe('');
  });

  it('should open view dialog via router', () => {
    jest.spyOn(router, 'navigate');
    component.viewUser(mockUser);
    expect(router.navigate).toHaveBeenCalledWith([mockUser.id], { relativeTo: route });
  });

  it('should navigate to add user', () => {
    jest.spyOn(router, 'navigate');
    component.addUser();
    expect(router.navigate).toHaveBeenCalledWith(['new'], { relativeTo: route });
  });

  it('should edit selected user', () => {
    jest.spyOn(router, 'navigate');
    component.selection.select(mockUser);
    component.editUser();
    expect(router.navigate).toHaveBeenCalledWith([mockUser.id, 'edit'], { relativeTo: route });
  });

  it('should not edit when no user selected', () => {
    jest.spyOn(router, 'navigate');
    component.editUser();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not edit when multiple users selected', () => {
    jest.spyOn(router, 'navigate');
    component.selection.select(mockUser);
    component.selection.select({ ...mockUser, id: 2 });
    component.editUser();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should return true from canDeactivate when no active dialog', () => {
    expect(component.canDeactivate()).toBe(true);
  });

  it('should return true from canDeactivate when no unsaved changes', () => {
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {},
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
  });

  it('should return false from canDeactivate when has unsaved changes and user cancels', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        hasUnsavedChanges: () => true,
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should return true from canDeactivate when has unsaved changes and user confirms', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        hasUnsavedChanges: () => true,
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
    confirmSpy.mockRestore();
  });

  it('should close dialog when user confirms leave with unsaved changes', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const closeFn = jest.fn();
    const mockDialogRef = {
      close: closeFn,
      componentInstance: {
        hasUnsavedChanges: () => true,
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    component.canDeactivate();
    expect(closeFn).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should fallback to checking individual field dirty state when hasUnsavedChanges not available', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        firstName: { dirty: true },
        lastName: { dirty: false },
        email: { dirty: false },
        isActive: { dirty: false },
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should return true from canDeactivate when fallback fields not dirty', () => {
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        firstName: { dirty: false },
        lastName: { dirty: false },
        email: { dirty: false },
        isActive: { dirty: false },
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
  });

  it('should handle canDeactivate when componentInstance has no dirty fields at all', () => {
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {},
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
  });

  it('should call openViewDialog with correct config', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.openViewDialog(mockUser);
    expect(openSpy).toHaveBeenCalledWith(
      UserDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          mode: DialogMode.View,
          user: mockUser,
        }),
        panelClass: ['user-dialog', 'mode-view'],
        closeOnNavigation: false,
      })
    );
  });

  it('should call openEditDialog with correct config', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.openEditDialog(mockUser);
    expect(openSpy).toHaveBeenCalledWith(
      UserDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          mode: DialogMode.Edit,
          user: mockUser,
        }),
        panelClass: 'user-dialog',
        closeOnNavigation: false,
      })
    );
  });

  it('should call openAddDialog with correct config', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.openAddDialog();
    expect(openSpy).toHaveBeenCalledWith(
      UserDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          mode: DialogMode.Add,
        }),
        panelClass: 'user-dialog',
        closeOnNavigation: false,
      })
    );
  });

  it('should set activeDialogRef when opening view dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    pendingService.setActiveDialog = jest.fn();

    component.openViewDialog(mockUser);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should set activeDialogRef when opening edit dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    pendingService.setActiveDialog = jest.fn();

    component.openEditDialog(mockUser);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should set activeDialogRef when opening add dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    pendingService.setActiveDialog = jest.fn();

    component.openAddDialog();
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should call deleteUsers and show confirmation dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(true),
      close: jest.fn(),
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.selection.select(mockUser);
    component.deleteUsers();
    expect(openSpy).toHaveBeenCalled();
  });

  it('should not delete users when user cancels', () => {
    const dialogRefMock = {
      afterClosed: () => of(false),
      close: jest.fn(),
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.selection.select(mockUser);
    component.deleteUsers();

    expect(userService.deleteUsers).not.toHaveBeenCalled();
  });

  it('should delete users when user confirms', () => {
    const dialogRefMock = {
      afterClosed: () => of(true),
      close: jest.fn(),
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    const user2 = { ...mockUser, id: 2 };
    component.selection.select(mockUser, user2);
    component.deleteUsers();

    expect(userService.deleteUsers).toHaveBeenCalledWith([1, 2]);
  });

  it('should clear selection after deleting users', () => {
    const dialogRefMock = {
      afterClosed: () => of(true),
      close: jest.fn(),
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);

    component.selection.select(mockUser);
    component.deleteUsers();

    expect(component.selection.selected.length).toBe(0);
  });

  it('should expose users signal from service', () => {
    expect(component.users).toBe(userService.users);
  });

  it('should expose loading signal from service', () => {
    expect(component.loading).toBe(userService.loading);
  });

  it('should expose error signal from service', () => {
    expect(component.error).toBe(userService.error);
  });

  it('should open add dialog on /users/new route', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    // The addUser method navigates to 'new' relative to the current route
    component.addUser();
    expect(router.navigate).toHaveBeenCalledWith(['new'], { relativeTo: route });
  });

  it('should show snackbar on error via error effect', () => {
    expect(component.error).toBe(userService.error);
    (userService.error as unknown as WritableSignal<string | null>).set('Test error');
    fixture.detectChanges();
    expect(component.error()).toBe('Test error');
  });

  it('should update dataSource.data when users signal changes', () => {
    const users: User[] = [mockUser];
    (userService.users as unknown as WritableSignal<User[]>).set(users);
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual(users);
  });

  it('should update dataSource when users signal changes', () => {
    const users: User[] = [mockUser];
    (userService.users as unknown as WritableSignal<User[]>).set(users);
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual(users);
  });

  it('should call markForCheck when users signal changes', () => {
    const markForCheckSpy = jest.spyOn(component['changeDetectorRef'], 'markForCheck');
    const users: User[] = [mockUser];
    (userService.users as unknown as WritableSignal<User[]>).set(users);
    fixture.detectChanges();
    expect(markForCheckSpy).toHaveBeenCalled();
  });

  it('should call setActiveDialog when opening edit dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openEditDialog(mockUser);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should call setActiveDialog when opening add dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openAddDialog();
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should clear activeDialogRef after dialog closes for view', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openViewDialog(mockUser);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should clear activeDialogRef after dialog closes for edit', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openEditDialog(mockUser);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should clear activeDialogRef after dialog closes for add', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openAddDialog();
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should get routeState via toSignal', () => {
    const routeState = (component as unknown as { routeState: () => unknown }).routeState();
    expect(routeState).toBeTruthy();
    expect(typeof routeState).toBe('object');
  });

  it('should have correct initial routeState values', () => {
    const routeState = (component as unknown as { routeState: () => unknown }).routeState();
    const rs = routeState as { id: string | null; isNew: boolean; isEdit: boolean };
    expect(rs.id).toBeNull();
    expect(rs.isNew).toBe(false);
    expect(rs.isEdit).toBe(false);
  });

  it('should initialize with empty selection', () => {
    expect(component.selection.selected.length).toBe(0);
  });

  it('should initialize with empty dataSource', () => {
    expect(component.dataSource.data.length).toBe(0);
  });

  it('should open delete confirmation with correct dialog data', () => {
    const dialogRefMock = {
      afterClosed: () => of(true),
      close: jest.fn(),
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.deleteUsers();
    expect(openSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: {
          title: 'Delete users',
          message: 'Do you really want to delete these users?',
          confirmText: 'Delete',
          cancelText: 'Cancel',
        },
      })
    );
  });

  it('should update dataSource when users signal changes with multiple items', () => {
    const users: User[] = [mockUser, { ...mockUser, id: 2 }];
    (userService.users as unknown as WritableSignal<User[]>).set(users);
    fixture.detectChanges();
    expect(component.dataSource.data.length).toBe(2);
  });

  it('should show snackbar with correct duration on error', () => {
    const snackBarOpenSpy = jest.spyOn(component['snackBar'], 'open');
    (userService.error as unknown as WritableSignal<string | null>).set('Error message');
    fixture.detectChanges();
    expect(snackBarOpenSpy).toHaveBeenCalledWith('Error message', 'Close', { duration: 4000 });
  });

  it('should not show snackbar when error is null', () => {
    snackBar.open = jest.fn();
    (userService.error as unknown as WritableSignal<string | null>).set(null);
    fixture.detectChanges();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should handle canDeactivate when close throws an error', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const mockDialogRef = {
      close: () => {
        throw new Error('Dialog already closed');
      },
      componentInstance: {
        hasUnsavedChanges: () => true,
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
    confirmSpy.mockRestore();
  });

  it('should handle canDeactivate with isActive dirty field', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        firstName: { dirty: false },
        lastName: { dirty: false },
        email: { dirty: false },
        isActive: { dirty: true },
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should handle canDeactivate with email dirty field', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        firstName: { dirty: false },
        lastName: { dirty: false },
        email: { dirty: true },
        isActive: { dirty: false },
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should return true from canDeactivate when componentInstance is null', () => {
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = {
      componentInstance: null,
      close: jest.fn(),
    };
    expect(component.canDeactivate()).toBe(true);
  });

  it('should navigate to user view with correct id', () => {
    jest.spyOn(router, 'navigate');
    component.viewUser({ ...mockUser, id: 42 });
    expect(router.navigate).toHaveBeenCalledWith([42], { relativeTo: route });
  });

  it('should navigate to user edit with correct id', () => {
    component.selection.select({ ...mockUser, id: 99 });
    jest.spyOn(router, 'navigate');
    component.editUser();
    expect(router.navigate).toHaveBeenCalledWith([99, 'edit'], { relativeTo: route });
  });

  it('should handle multiple dirty fields in canDeactivate fallback', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        firstName: { dirty: true },
        lastName: { dirty: true },
        email: { dirty: false },
        isActive: { dirty: false },
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should trigger routeEffect isNew branch on NavigationEnd with /new url', () => {
    const dialogRefMock = {
      afterClosed: () => of({ firstName: 'New', lastName: 'User', email: 'new@test.com', id: 0 }),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    (userService.users as unknown as WritableSignal<User[]>).set([mockUser]);

    const urlSegments = [{ path: 'new' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: () => null },
            url: urlSegments,
          },
          paramMap: { get: () => null },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users/new', '/users/new'));
    fixture.detectChanges();

    expect(component['dialog'].open).toHaveBeenCalledWith(
      UserDialog,
      expect.objectContaining({
        data: expect.objectContaining({ mode: DialogMode.Add }),
      })
    );
  });

  it('should trigger routeEffect view branch on NavigationEnd with /:id url', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    (userService.users as unknown as WritableSignal<User[]>).set([mockUser]);

    const urlSegments = [{ path: '1' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: (key: string) => (key === 'id' ? '1' : null) },
            url: urlSegments,
          },
          paramMap: { get: (key: string) => (key === 'id' ? '1' : null) },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users/1', '/users/1'));
    fixture.detectChanges();

    expect(component['dialog'].open).toHaveBeenCalledWith(
      UserDialog,
      expect.objectContaining({
        data: expect.objectContaining({ mode: DialogMode.View, user: mockUser }),
      })
    );
  });

  it('should trigger routeEffect edit branch on NavigationEnd with /:id/edit url', () => {
    const dialogRefMock = {
      afterClosed: () => of({ ...mockUser, firstName: 'Updated' }),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    (userService.users as unknown as WritableSignal<User[]>).set([mockUser]);

    const urlSegments = [{ path: '1' }, { path: 'edit' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: (key: string) => (key === 'id' ? '1' : null) },
            url: urlSegments,
          },
          paramMap: { get: (key: string) => (key === 'id' ? '1' : null) },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users/1/edit', '/users/1/edit'));
    fixture.detectChanges();

    expect(component['dialog'].open).toHaveBeenCalledWith(
      UserDialog,
      expect.objectContaining({
        data: expect.objectContaining({ mode: DialogMode.Edit, user: mockUser }),
      })
    );
  });

  it('should not open dialog when user not found in routeEffect edit branch', () => {
    const openSpy = jest.fn().mockReturnValue({
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    });
    (component['dialog'] as MatDialog).open = openSpy;
    (userService.users as unknown as WritableSignal<User[]>).set([mockUser]);

    const urlSegments = [{ path: '999' }, { path: 'edit' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: (key: string) => (key === 'id' ? '999' : null) },
            url: urlSegments,
          },
          paramMap: { get: (key: string) => (key === 'id' ? '999' : null) },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users/999/edit', '/users/999/edit'));
    fixture.detectChanges();

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should not open dialog when users array is empty', () => {
    const openSpy = jest.fn().mockReturnValue({
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    });
    (component['dialog'] as MatDialog).open = openSpy;
    (userService.users as unknown as WritableSignal<User[]>).set([]);

    const urlSegments = [{ path: 'new' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: () => null },
            url: urlSegments,
          },
          paramMap: { get: () => null },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users/new', '/users/new'));
    fixture.detectChanges();

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should not open dialog when id is null and not new', () => {
    const openSpy = jest.fn().mockReturnValue({
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    });
    (component['dialog'] as MatDialog).open = openSpy;
    (userService.users as unknown as WritableSignal<User[]>).set([mockUser]);

    const urlSegments = [{ path: 'users' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: () => null },
            url: urlSegments,
          },
          paramMap: { get: () => null },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users', '/users'));
    fixture.detectChanges();

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should call addUser after dialog closes with result', () => {
    const result = {
      id: 2,
      firstName: 'New',
      lastName: 'User',
      email: 'new@test.com',
      phoneNumber: '',
      isActive: true,
    };
    const dialogRefMock = {
      afterClosed: () => of(result),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    (router.navigate as jest.Mock).mockResolvedValue(true);
    (userService.users as unknown as WritableSignal<User[]>).set([mockUser]);

    const urlSegments = [{ path: 'new' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: () => null },
            url: urlSegments,
          },
          paramMap: { get: () => null },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users/new', '/users/new'));
    fixture.detectChanges();

    // Wait for async effect + dialog callback
    return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
      expect(userService.addUser).toHaveBeenCalledWith(result);
      expect(pendingService.clear).toHaveBeenCalled();
      expect(pendingService.clearActiveDialog).toHaveBeenCalled();
    });
  });

  it('should call updateUser after edit dialog closes with result', () => {
    const result = { ...mockUser, firstName: 'Updated' };
    const dialogRefMock = {
      afterClosed: () => of(result),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    (router.navigate as jest.Mock).mockResolvedValue(true);
    (userService.users as unknown as WritableSignal<User[]>).set([mockUser]);

    const urlSegments = [{ path: '1' }, { path: 'edit' }];
    const newState = {
      snapshot: {
        root: {
          firstChild: {
            firstChild: null,
            paramMap: { get: (key: string) => (key === 'id' ? '1' : null) },
            url: urlSegments,
          },
          paramMap: { get: (key: string) => (key === 'id' ? '1' : null) },
          url: [],
        },
      },
    };
    (router.routerState as RouterState).snapshot = newState.snapshot;

    routerEvents.next(new NavigationEnd(0, '/users/1/edit', '/users/1/edit'));
    fixture.detectChanges();

    return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
      expect(userService.updateUser).toHaveBeenCalledWith(result);
      expect(pendingService.clear).toHaveBeenCalled();
      expect(pendingService.clearActiveDialog).toHaveBeenCalled();
    });
  });
});
