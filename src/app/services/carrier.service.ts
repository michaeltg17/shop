import { Injectable, signal } from '@angular/core';
import { Carrier } from '../models/carrier';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarrierService {
  private carriersSubject = new BehaviorSubject<Carrier[]>([]);
  public carriers$ = this.carriersSubject.asObservable();

  // Using signals for reactive updates
  carriers = signal<Carrier[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Initialize with some sample data
    this.loadCarriers();
  }

  loadCarriers(): void {
    this.loading.set(true);
    this.error.set(null);

    // Simulate API call
    setTimeout(() => {
      try {
        const storedCarriers = localStorage.getItem('carriers');
        const carriers = storedCarriers ? JSON.parse(storedCarriers) : [
          {
            id: 1,
            name: 'UPS',
            trackingUrl: 'https://www.ups.com/track',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            name: 'FedEx',
            trackingUrl: 'https://www.fedex.com/apps/fedextrack/',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 3,
            name: 'USPS',
            trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction_input',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        this.carriers.set(carriers);
        this.carriersSubject.next(carriers);
        this.loading.set(false);
      } catch (err) {
        this.error.set('Failed to load carriers');
        this.loading.set(false);
      }
    }, 500);
  }

  addCarrier(carrier: Omit<Carrier, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => {
      try {
        const newCarrier: Carrier = {
          ...carrier,
          id: this.generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const currentCarriers = this.carriers();
        const updatedCarriers = [...currentCarriers, newCarrier];

        this.carriers.set(updatedCarriers);
        this.carriersSubject.next(updatedCarriers);
        this.saveCarriers(updatedCarriers);
        this.loading.set(false);
      } catch (err) {
        this.error.set('Failed to add carrier');
        this.loading.set(false);
      }
    }, 300);
  }

  updateCarrier(carrier: Carrier): void {
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => {
      try {
        const currentCarriers = this.carriers();
        const updatedCarriers = currentCarriers.map(c =>
          c.id === carrier.id ? { ...carrier, updatedAt: new Date() } : c
        );

        this.carriers.set(updatedCarriers);
        this.carriersSubject.next(updatedCarriers);
        this.saveCarriers(updatedCarriers);
        this.loading.set(false);
      } catch (err) {
        this.error.set('Failed to update carrier');
        this.loading.set(false);
      }
    }, 300);
  }

  deleteCarrier(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => {
      try {
        const currentCarriers = this.carriers();
        const updatedCarriers = currentCarriers.filter(c => c.id !== id);

        this.carriers.set(updatedCarriers);
        this.carriersSubject.next(updatedCarriers);
        this.saveCarriers(updatedCarriers);
        this.loading.set(false);
      } catch (err) {
        this.error.set('Failed to delete carrier');
        this.loading.set(false);
      }
    }, 300);
  }

  private generateId(): number {
    const currentCarriers = this.carriers();
    return currentCarriers.length > 0
      ? Math.max(...currentCarriers.map(c => c.id)) + 1
      : 1;
  }

  private saveCarriers(carriers: Carrier[]): void {
    localStorage.setItem('carriers', JSON.stringify(carriers));
  }
}