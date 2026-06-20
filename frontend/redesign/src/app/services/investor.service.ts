import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Investor } from '../models/interfaces';
import { ApiService } from './api.service';
import { SectorService } from './sector.service';

@Injectable({ providedIn: 'root' })
export class InvestorService {
  private list$ = new BehaviorSubject<Investor[]>([]);

  constructor(private api: ApiService, private sectorService: SectorService) {
    this.loadInvestors();
  }

  private loadInvestors(): void {
    this.api.getInvestors().subscribe(
      (response: any[]) => {
        const source = Array.isArray(response) ? response : [];
        const investors = source.map(inv => ({
          id: inv.investorId?.toString(),
          name: inv.investorName,
          mobile: inv.mobile,
          availability: inv.availabilities?.map((avail: any) => ({
            sector: this.sectorService.getSectorName(avail.sectorId),
            availableDate: avail.availableDate,
            start: this.timeToDisplay(avail.startTime),
            end: this.timeToDisplay(avail.endTime),
          })) || [],
        }));
        this.list$.next(investors);
      },
      (error) => console.error('Error loading investors:', error)
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

  list(): Observable<Investor[]> { return this.list$.asObservable(); }

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

  private toApiPayload(inv: Omit<Investor, 'id'> | Investor): any {
    return {
      investorName: inv.name,
      mobile: inv.mobile,
      availabilities: inv.availability.map(a => ({
        sectorId: typeof a.sector === 'string' ? this.sectorService.getSectorId(a.sector) : (a.sector as any).sectorId,
        availableDate: a.availableDate,
        startTime: this.toApiTime(a.start),
        endTime: this.toApiTime(a.end),
      })),
    };
  }

  add(inv: Omit<Investor, 'id'>): Observable<Investor> {
    return this.api.addInvestor(this.toApiPayload(inv)).pipe(
      tap(() => {
        this.loadInvestors();
      })
    );
  }

  update(inv: Investor): Observable<Investor> {
    return this.api.updateInvestor(inv.id, this.toApiPayload(inv)).pipe(
      tap(() => {
        this.list$.next(this.list$.value.map(i => i.id === inv.id ? inv : i));
      })
    );
  }

  remove(id: string): Observable<void> {
    return this.api.deleteInvestor(id).pipe(
      tap(() => {
        this.list$.next(this.list$.value.filter(i => i.id !== id));
      })
    );
  }
}
