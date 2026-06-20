import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { concatMap, map, toArray, tap } from 'rxjs/operators';
import { Hotel, ConferenceRoom, TimeSlot } from '../models/interfaces';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class HotelService {
  private hotels$ = new BehaviorSubject<Hotel[]>([]);

  constructor(private api: ApiService) {
    this.loadHotels();
  }

  private loadHotels(): void {
    this.api.getHotels().subscribe(
      (response: any) => {
        const hotels = this.mapBackendToFrontend(response);
        this.hotels$.next(hotels);
      },
      (error) => console.error('Error loading hotels:', error)
    );
  }

  private mapBackendToFrontend(backendData: any[]): Hotel[] {
    return backendData.map(hotel => ({
      id: hotel.hotelId?.toString(),
      name: hotel.hotelName,
      address: hotel.address,
      rooms: hotel.rooms?.map((room: any) => ({
        id: room.roomId?.toString(),
        name: room.roomName,
        floor: room.floor,
        slots: room.slots?.map((slot: any) => ({
          id: slot.slotId?.toString(),
          date: slot.slotDate,
          start: this.timeToDisplay(slot.startTime),
          end: this.timeToDisplay(slot.endTime),
          booked: slot.isBooked,
        })) || [],
      })) || [],
    }));
  }

  private timeToApi(display: string): string {
    if (!display) return '';
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

  private timeToDisplay(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${suffix}`;
  }

  list(): Observable<Hotel[]> { return this.hotels$.asObservable(); }

  addHotel(name: string, address: string): Observable<Hotel> {
    return this.api.addHotel({ name, address }).pipe(
      tap((response: any) => {
        const newHotel: Hotel = {
          id: response.hotelId,
          name: response.hotelName,
          address: response.address,
          rooms: [],
        };
        this.hotels$.next([...this.hotels$.value, newHotel]);
      })
    );
  }

  addRoom(hotelId: string, name: string, floor?: number): Observable<ConferenceRoom> {
    return this.api.addRoom(hotelId, { roomName: name }).pipe(
      map((response: any) => ({
        id: response.roomId?.toString(),
        name: response.roomName,
        floor,
        slots: [],
      } as ConferenceRoom)),
      tap(() => this.loadHotels())
    );
  }

  addSlot(hotelId: string, roomId: string, date: string, start: string, end: string): Observable<TimeSlot[]> {
    const startApi = this.timeToApi(start);
    const endApi = this.timeToApi(end);
    const slices = this.buildHourlySlices(date, startApi, endApi);

    if (slices.length === 0) {
      return of([]);
    }

    return from(slices).pipe(
      concatMap(slice => this.api.addRoomSlot(roomId, slice)),
      map((response: any) => ({
        id: response.slotId?.toString(),
        date: response.slotDate,
        start: this.timeToDisplay(response.startTime),
        end: this.timeToDisplay(response.endTime),
        booked: response.isBooked ?? false,
      } as TimeSlot)),
      toArray(),
      tap(() => this.loadHotels())
    );
  }

  private buildHourlySlices(date: string, startTime: string, endTime: string): Array<{ slotDate: string; startTime: string; endTime: string }> {
    const startMinutes = this.toMinutes(startTime);
    const endMinutes = this.toMinutes(endTime);

    if (!date || Number.isNaN(startMinutes) || Number.isNaN(endMinutes) || endMinutes <= startMinutes) {
      return [];
    }

    const ranges: Array<{ slotDate: string; startTime: string; endTime: string }> = [];
    for (let current = startMinutes; current < endMinutes; current += 60) {
      const next = current + 60;
      ranges.push({
        slotDate: date,
        startTime: this.minutesToTime(current),
        endTime: this.minutesToTime(next),
      });
    }

    return ranges;
  }

  private toMinutes(apiTime: string): number {
    const match = apiTime.match(/^(\d{2}):(\d{2})$/);
    if (!match) return Number.NaN;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }

  private minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  removeHotel(hotelId: string): Observable<void> {
    return this.api.deleteHotel(hotelId).pipe(
      tap(() => this.loadHotels()),
      map(() => void 0)
    );
  }

  removeRoom(hotelId: string, roomId: string): Observable<void> {
    return this.api.deleteRoom(roomId).pipe(
      tap(() => this.loadHotels()),
      map(() => void 0)
    );
  }

  removeSlot(hotelId: string, roomId: string, slotId: string): Observable<void> {
    return this.api.deleteRoomSlot(slotId).pipe(
      tap(() => this.loadHotels()),
      map(() => void 0)
    );
  }

  markSlotBooked(hotelId: string, roomId: string, slotId: string): void {
    const updated = this.hotels$.value.map(h =>
      h.id !== hotelId ? h : {
        ...h,
        rooms: h.rooms.map(r => r.id !== roomId ? r : {
          ...r,
          slots: r.slots.map(s => s.id === slotId ? { ...s, booked: true } : s),
        }),
      }
    );
    this.hotels$.next(updated);
  }
}
