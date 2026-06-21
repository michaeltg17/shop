import { inject, Injectable, signal } from '@angular/core';
import { User } from './user';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { EMPTY } from 'rxjs';

export interface UserCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersUrl = 'api/users';
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  private readonly http = inject(HttpClient);

  loadUsers() {
    // Skip API call if users are already loaded
    if (this.users().length > 0) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<User[]>(this.usersUrl)
      .pipe(
        tap(users => {
          users.forEach(u => {
            if (typeof u.isActive === 'string') {
              u.isActive = u.isActive === 'true';
            }
          });
          this.users.set(users);
        }),
        catchError(() => {
          this.error.set('Failed to load users');
          this.loading.set(false);
          return of([]);
        })
      )
      .subscribe({
        complete: () => this.loading.set(false),
      });
  }

  addUser(user: User) {
    this.http
      .post<User>(this.usersUrl, user)
      .pipe(
        tap(newUser => {
          const current = this.users();
          this.users.set([...current, newUser]);
        }),
        catchError(() => {
          this.error.set('Failed to add user');
          return EMPTY;
        })
      )
      .subscribe();
  }

  updateUser(user: User) {
    this.http
      .put<User>(`${this.usersUrl}/${user.id}`, user)
      .pipe(
        tap(() => {
          const current = this.users();
          const index = current.findIndex(u => u.id === user.id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = user;
            this.users.set(updated);
          }
        }),
        catchError(() => {
          this.error.set('Failed to update user');
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteUsers(ids: number[]) {
    this.http
      .delete(this.usersUrl, { body: ids })
      .pipe(
        tap(() => {
          const current = this.users();
          this.users.set(current.filter(u => !ids.includes(u.id)));
        }),
        catchError(() => {
          this.error.set('Failed to delete users');
          return EMPTY;
        })
      )
      .subscribe();
  }
}
