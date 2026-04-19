import { inject, Injectable, signal } from '@angular/core';
import { Carrier } from './carrier';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CarrierService {
  private carriersUrl = 'api/carriers';
  carriers = signal<Carrier[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  private readonly http = inject(HttpClient);

  loadCarriers() {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<Carrier[]>(this.carriersUrl)
      .pipe(
        tap(carriers => this.carriers.set(carriers)),
        catchError(() => {
          this.error.set('Failed to load carriers');
          this.loading.set(false);
          return EMPTY;
        })
      )
      .subscribe({
        complete: () => this.loading.set(false),
      });
  }

  addCarrier(carrier: Carrier) {
    this.http
      .post<Carrier>(this.carriersUrl, carrier)
      .pipe(
        tap(newCarrier => {
          const current = this.carriers();
          this.carriers.set([...current, newCarrier]);
        }),
        catchError(() => {
          this.error.set('Failed to add carrier');
          return EMPTY;
        })
      )
      .subscribe();
  }

  updateCarrier(carrier: Carrier) {
    this.http
      .put<Carrier>(`${this.carriersUrl}/${carrier.id}`, carrier)
      .pipe(
        tap(() => {
          const current = this.carriers();
          const index = current.findIndex(c => c.id === carrier.id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = carrier;
            this.carriers.set(updated);
          }
        }),
        catchError(() => {
          this.error.set('Failed to update carrier');
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteCarrier(id: number) {
    this.http
      .delete(`${this.carriersUrl}/${id}`)
      .pipe(
        tap(() => {
          const current = this.carriers();
          this.carriers.set(current.filter(c => c.id !== id));
        }),
        catchError(() => {
          this.error.set('Failed to delete carrier');
          return EMPTY;
        })
      )
      .subscribe();
  }
}
