import { TestBed } from '@angular/core/testing';
import { UserService, UserCredentials } from './user.service';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { User } from './user';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty users', () => {
    expect(service.users()).toEqual([]);
  });

  it('should start with loading false', () => {
    expect(service.loading()).toBe(false);
  });

  it('should start with no error', () => {
    expect(service.error()).toBeNull();
  });

  it('should load users from API', () => {
    const mockUsers: User[] = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phoneNumber: '123', isActive: true },
    ];

    service.loadUsers();

    const req = httpMock.expectOne('api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);

    expect(service.users()).toEqual(mockUsers);
    expect(service.loading()).toBe(false);
  });

  it('should skip loading if users already loaded', () => {
    const mockUsers: User[] = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phoneNumber: '123', isActive: true },
    ];

    // First load
    service.loadUsers();
    httpMock.expectOne('api/users').flush(mockUsers);

    // Second load should not make HTTP request
    const pendingReqs = httpMock.match();
    service.loadUsers();
    expect(httpMock.match()).toEqual(pendingReqs);
  });

  it('should set error on load failure', () => {
    service.loadUsers();

    const req = httpMock.expectOne('api/users');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to load users');
    expect(service.loading()).toBe(false);
    expect(service.users()).toEqual([]);
  });

  it('should convert string isActive to boolean on load', () => {
    const mockUsers = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phoneNumber: '123', isActive: 'true' as unknown as boolean },
    ];

    service.loadUsers();

    const req = httpMock.expectOne('api/users');
    req.flush(mockUsers);

    expect(service.users()[0].isActive).toBe(true);
  });

  it('should add a new user', () => {
    const existingUsers: User[] = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phoneNumber: '123', isActive: true },
    ];
    service.users.set(existingUsers);

    const newUser: User = { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', phoneNumber: '456', isActive: true };

    service.addUser(newUser);

    const req = httpMock.expectOne('api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush(newUser);

    expect(service.users()).toEqual([...existingUsers, newUser]);
  });

  it('should set error on add failure', () => {
    const newUser: User = { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', phoneNumber: '456', isActive: true };

    service.addUser(newUser);

    const req = httpMock.expectOne('api/users');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to add user');
  });

  it('should update an existing user', () => {
    const existingUsers: User[] = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phoneNumber: '123', isActive: true },
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', phoneNumber: '456', isActive: true },
    ];
    service.users.set(existingUsers);

    const updatedUser: User = { id: 1, firstName: 'John', lastName: 'Updated', email: 'john@updated.com', phoneNumber: '789', isActive: false };

    service.updateUser(updatedUser);

    const req = httpMock.expectOne(`api/users/${updatedUser.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedUser);
    req.flush(updatedUser);

    expect(service.users()).toEqual([updatedUser, existingUsers[1]]);
  });

  it('should set error on update failure', () => {
    const updatedUser: User = { id: 1, firstName: 'John', lastName: 'Updated', email: 'john@updated.com', phoneNumber: '789', isActive: false };

    service.updateUser(updatedUser);

    const req = httpMock.expectOne(`api/users/${updatedUser.id}`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to update user');
  });

  it('should delete users by ids', () => {
    const existingUsers: User[] = [
      { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', phoneNumber: '123', isActive: true },
      { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', phoneNumber: '456', isActive: true },
      { id: 3, firstName: 'Bob', lastName: 'Brown', email: 'bob@test.com', phoneNumber: '789', isActive: true },
    ];
    service.users.set(existingUsers);

    const idsToDelete = [1, 3];

    service.deleteUsers(idsToDelete);

    const req = httpMock.expectOne('api/users');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual(idsToDelete);
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.users()).toEqual([existingUsers[1]]);
  });

  it('should set error on delete failure', () => {
    service.deleteUsers([1]);

    const req = httpMock.expectOne('api/users');
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to delete users');
  });
});
