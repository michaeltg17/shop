import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { User, FakeStoreUser, fakeStoreUserToUser } from './user';

const usersUrl = 'https://fakestoreapi.com/users';

function makeFakeStoreUser(u: User): FakeStoreUser {
  return {
    id: u.id,
    email: u.email,
    username: u.email.split('@')[0],
    password: 'password123',
    name: { firstname: u.firstName, lastname: u.lastName },
    phone: u.phoneNumber,
    __v: 0,
  };
}

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

  it('should load users from API and map FakeStoreUser to User', () => {
    const mockFakeUsers: FakeStoreUser[] = [
      {
        id: 1,
        email: 'john@test.com',
        username: 'johnd',
        password: 'secret',
        name: { firstname: 'John', lastname: 'Doe' },
        phone: '123',
        __v: 0,
      },
    ];

    service.loadUsers();

    const req = httpMock.expectOne(usersUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockFakeUsers);

    expect(service.users()).toEqual([fakeStoreUserToUser(mockFakeUsers[0])]);
    expect(service.loading()).toBe(false);
  });

  it('should skip loading if users already loaded', () => {
    const mockFakeUsers: FakeStoreUser[] = [
      {
        id: 1,
        email: 'john@test.com',
        username: 'johnd',
        password: 'secret',
        name: { firstname: 'John', lastname: 'Doe' },
        phone: '123',
        __v: 0,
      },
    ];

    // First load
    service.loadUsers();
    httpMock.expectOne(usersUrl).flush(mockFakeUsers);

    // Second load should not make HTTP request
    const pendingReqs = httpMock.match();
    service.loadUsers();
    expect(httpMock.match()).toEqual(pendingReqs);
  });

  it('should set error on load failure', () => {
    service.loadUsers();

    const req = httpMock.expectOne(usersUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to load users');
    expect(service.loading()).toBe(false);
    expect(service.users()).toEqual([]);
  });

  it('should add a new user', () => {
    const existingUsers: User[] = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phoneNumber: '123',
        isActive: true,
      },
    ];
    service.users.set(existingUsers);

    const newUser: User = {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      phoneNumber: '456',
      isActive: true,
    };

    service.addUser(newUser);

    const req = httpMock.expectOne(usersUrl);
    expect(req.request.method).toBe('POST');
    req.flush(makeFakeStoreUser(newUser) as FakeStoreUser);

    expect(service.users()).toEqual([...existingUsers, newUser]);
  });

  it('should set error on add failure', () => {
    const newUser: User = {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      phoneNumber: '456',
      isActive: true,
    };

    service.addUser(newUser);

    const req = httpMock.expectOne(usersUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to add user');
  });

  it('should update an existing user using PATCH', () => {
    const existingUsers: User[] = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phoneNumber: '123',
        isActive: true,
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        phoneNumber: '456',
        isActive: true,
      },
    ];
    service.users.set(existingUsers);

    const updatedUser: User = {
      id: 1,
      firstName: 'John',
      lastName: 'Updated',
      email: 'john@updated.com',
      phoneNumber: '789',
      isActive: false,
    };

    service.updateUser(updatedUser);

    const req = httpMock.expectOne(`${usersUrl}/${updatedUser.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush(makeFakeStoreUser(updatedUser) as FakeStoreUser);

    expect(service.users()).toEqual([updatedUser, existingUsers[1]]);
  });

  it('should set error on update failure', () => {
    const updatedUser: User = {
      id: 1,
      firstName: 'John',
      lastName: 'Updated',
      email: 'john@updated.com',
      phoneNumber: '789',
      isActive: false,
    };

    service.updateUser(updatedUser);

    const req = httpMock.expectOne(`${usersUrl}/${updatedUser.id}`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to update user');
  });

  it('should delete a single user', () => {
    const existingUsers: User[] = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phoneNumber: '123',
        isActive: true,
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        phoneNumber: '456',
        isActive: true,
      },
    ];
    service.users.set(existingUsers);

    service.deleteUser(1);

    const req = httpMock.expectOne(`${usersUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.users()).toEqual([existingUsers[1]]);
  });

  it('should set error on deleteUser failure', () => {
    service.deleteUser(1);

    const req = httpMock.expectOne(`${usersUrl}/1`);
    req.flush({ error: 'fail' }, { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to delete user');
  });

  it('should delete users by ids (batch)', () => {
    const existingUsers: User[] = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phoneNumber: '123',
        isActive: true,
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@test.com',
        phoneNumber: '456',
        isActive: true,
      },
      {
        id: 3,
        firstName: 'Bob',
        lastName: 'Brown',
        email: 'bob@test.com',
        phoneNumber: '789',
        isActive: true,
      },
    ];
    service.users.set(existingUsers);

    const idsToDelete = [1, 3];

    service.deleteUsers(idsToDelete);

    // First delete
    let req = httpMock.expectOne(`${usersUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    // Second delete
    req = httpMock.expectOne(`${usersUrl}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.users()).toEqual([existingUsers[1]]);
  });

  it('should set error on delete failure', () => {
    service.deleteUsers([1]);

    const req = httpMock.expectOne(`${usersUrl}/1`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(service.error()).toBe('Failed to delete user 1');
  });
});
