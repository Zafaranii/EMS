import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Presenter } from '../models/interfaces';
import { ApiService } from './api.service';
import { SectorService } from './sector.service';

@Injectable({ providedIn: 'root' })
export class PresenterService {
  private list$ = new BehaviorSubject<Presenter[]>([]);

  constructor(private api: ApiService, private sectorService: SectorService) {
    this.loadPresenters();
  }

  private loadPresenters(): void {
    this.api.getPresenters().subscribe(
      (response: any[]) => {
        const source = Array.isArray(response) ? response : [];
        const presenters = source.map(pres => ({
          id: pres.presenterId?.toString(),
          name: pres.presenterName,
          mobile: pres.mobile,
          availability: pres.availabilities?.map((avail: any) => ({
            sector: this.sectorService.getSectorName(avail.sectorId),
            availableDate: avail.availableDate,
            start: this.timeToDisplay(avail.startTime),
            end: this.timeToDisplay(avail.endTime),
          })) || [],
        }));
        this.list$.next(presenters);
      },
      (error) => console.error('Error loading presenters:', error)
    );
  }

  private timeToDisplay(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${suffix}`;
  }

  list(): Observable<Presenter[]> { return this.list$.asObservable(); }

  private toApiTime(display: string): string {
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

  private toApiPayload(p: Omit<Presenter, 'id'> | Presenter): any {
    return {
      presenterName: p.name,
      mobile: p.mobile,
      availabilities: p.availability.map(a => ({
        sectorId: typeof a.sector === 'string' ? this.sectorService.getSectorId(a.sector) : (a.sector as any).sectorId,
        availableDate: a.availableDate,
        startTime: this.toApiTime(a.start),
        endTime: this.toApiTime(a.end),
      })),
    };
  }

  add(p: Omit<Presenter, 'id'>): Observable<Presenter> {
    return this.api.addPresenter(this.toApiPayload(p)).pipe(
      tap(() => {
        this.loadPresenters();
      })
    );
  }

  update(p: Presenter): Observable<Presenter> {
    return this.api.updatePresenter(p.id, this.toApiPayload(p)).pipe(
      tap(() => {
        this.list$.next(this.list$.value.map(i => i.id === p.id ? p : i));
      })
    );
  }

  remove(id: string): Observable<void> {
    return this.api.deletePresenter(id).pipe(
      tap(() => {
        this.list$.next(this.list$.value.filter(i => i.id !== id));
      })
    );
  }
}
