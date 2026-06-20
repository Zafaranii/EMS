import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, throwError } from 'rxjs';
import { Reservation } from '../models/interfaces';
import { ApiService } from './api.service';
import { SectorService } from './sector.service';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private list$ = new BehaviorSubject<Reservation[]>([]);

  constructor(private api: ApiService, private sectorService: SectorService) {
    this.loadReservations();
  }

  private toDisplayTime(time: string): string {
    if (!time) return '';
    const [hours] = time.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${suffix}`;
  }

  private toApiTime(display: string): string {
    const m = display.trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)$/);
    if (!m) return display;

    let hours = parseInt(m[1], 10);
    const minutes = m[2] ?? '00';
    const suffix = m[3];

    if (hours === 12) {
      hours = suffix === 'AM' ? 0 : 12;
    } else if (suffix === 'PM') {
      hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  private nextHourDisplay(display: string): string {
    const m = display.trim().toUpperCase().match(/^(\d{1,2})(AM|PM)$/);
    if (!m) return display;

    let h = parseInt(m[1], 10) % 12;
    if (m[2] === 'PM') h += 12;
    h = (h + 1) % 24;

    const suffix = h >= 12 ? 'PM' : 'AM';
    const d = h % 12 === 0 ? 12 : h % 12;
    return `${d}${suffix}`;
  }

  private loadReservations(): void {
    this.api.getReservations().subscribe(
      (response: any[]) => {
        const source = Array.isArray(response) ? response : [];
        const reservations = source.map(res => ({
          id: res.reservationId?.toString?.() ?? crypto.randomUUID(),
          investorId: '',
          investorName: res.investorName,
          presenterId: '',
          presenterName: res.presenterName,
          sector: res.sectorName,
          hotelId: '',
          hotelName: res.hotelName,
          roomId: '',
          roomName: res.roomName,
          slotDate: res.slotDate,
          timeSlot: `${this.toDisplayTime(res.startTime)}–${this.toDisplayTime(res.endTime)}`,
          status: 'Confirmed' as const,
          bookedAt: res.bookedAt,
        }));
        this.list$.next(reservations);
      },
      (error) => console.error('Error loading reservations:', error)
    );
  }

  list(): Observable<Reservation[]> { return this.list$.asObservable(); }

  getMatchingPresenterIds(sector: string, startDisplay: string, slotDate: string): Observable<Set<string>> {
    const sectorId = this.sectorService.getSectorId(sector);
    if (!sectorId) {
      return throwError(() => new Error('Invalid sector for presenter matching'));
    }

    const startTime = this.toApiTime(startDisplay);
    const endTime = this.toApiTime(this.nextHourDisplay(startDisplay));

    return this.api.getMatchingPresenters({
      sectorId,
      startTime,
      endTime,
      slotDate,
    }).pipe(
      map((rows: any[]) => new Set((rows ?? []).map(r => r.presenterId?.toString())))
    );
  }

  getAvailableRoomsByTime(startDisplay: string, slotDate: string): Observable<any[]> {
    const startTime = this.toApiTime(startDisplay);
    return this.api.getAvailableRooms({ startTime, slotDate }).pipe(
      map((rows: any[]) => rows ?? [])
    );
  }

  getInvestorBookedStartTimes(investorId: string, slotDate: string): Observable<Set<string>> {
    return this.api.getInvestorBookedTimes({ investorId, slotDate }).pipe(
      map((rows: any[]) => {
        const values = (rows ?? []).map(r => this.toDisplayTime(r.startTime));
        return new Set(values);
      })
    );
  }

  /**
   * Payload MUST include slotDate (SlotDate on the backend) so the API can
   * validate availability by date + time.
   */
  add(r: Omit<Reservation, 'id' | 'bookedAt' | 'status'>): Observable<Reservation> {
    const sectorId = this.sectorService.getSectorId(r.sector);
    const investorId = Number(r.investorId);
    const presenterId = Number(r.presenterId);
    const slotId = Number(r.slotId);

    if (!sectorId || Number.isNaN(investorId) || Number.isNaN(presenterId) || Number.isNaN(slotId)) {
      return throwError(() => new Error('Invalid reservation payload'));
    }

    const payload = {
      investorId,
      presenterId,
      slotId,
      sectorId,
    };

    return this.api.addReservation(payload).pipe(
      map((response: any) => {
        const created: Reservation = {
          ...r,
          id: crypto.randomUUID(),
          bookedAt: new Date().toISOString(),
          status: ((response?.status as 'Confirmed' | 'Pending' | undefined) ?? 'Confirmed'),
        };
        this.list$.next([created, ...this.list$.value]);
        return created;
      })
    );
  }
}
