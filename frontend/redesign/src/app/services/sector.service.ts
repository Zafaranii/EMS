import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface Sector {
  sectorId: number;
  sectorName: string;
}

@Injectable({
  providedIn: 'root'
})
export class SectorService {
  private sectors$ = new BehaviorSubject<Sector[]>([]);
  private sectorMap = new Map<number, string>();
  private sectorIdMap = new Map<string, number>();

  private readonly fallbackSectorIds: Record<string, number> = {
    finance: 1,
    it: 2,
    restaurants: 3,
    'real estate': 4,
    retail: 5,
    healthcare: 6,
  };

  private readonly fallbackSectorNames: Record<number, string> = {
    1: 'Finance',
    2: 'IT',
    3: 'Restaurants',
    4: 'Real Estate',
    5: 'Retail',
    6: 'Healthcare',
  };

  constructor(private api: ApiService) {
    this.loadSectors();
  }

  private normalizeName(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private canonicalName(value: string): string {
    const key = this.normalizeName(value);

    if (key === 'it') return 'IT';
    if (key === 'real estate') return 'Real Estate';
    if (key === 'finance') return 'Finance';
    if (key === 'restaurants') return 'Restaurants';
    if (key === 'retail') return 'Retail';
    if (key === 'healthcare') return 'Healthcare';

    return value.trim();
  }

  private loadSectors(): void {
    this.api.getSectors().subscribe(
      (response: any[]) => {
        const sectors = (response ?? []).map((s: any) => ({
          sectorId: s.sectorId,
          sectorName: this.canonicalName(s.sectorName ?? ''),
        }));
        this.sectors$.next(sectors);
        this.buildSectorMap(sectors);
      },
      (error) => console.error('Error loading sectors:', error)
    );
  }

  private buildSectorMap(sectors: Sector[]): void {
    this.sectorMap.clear();
    this.sectorIdMap.clear();

    sectors.forEach(s => {
      const name = this.canonicalName(s.sectorName);
      this.sectorMap.set(s.sectorId, name);
      this.sectorIdMap.set(this.normalizeName(name), s.sectorId);
    });

    // Keep mapping resilient even if sectors API is late or partially missing.
    Object.entries(this.fallbackSectorIds).forEach(([name, id]) => {
      if (!this.sectorIdMap.has(name)) {
        this.sectorIdMap.set(name, id);
      }
      if (!this.sectorMap.has(id)) {
        this.sectorMap.set(id, this.fallbackSectorNames[id]);
      }
    });
  }

  list(): Observable<Sector[]> {
    return this.sectors$.asObservable();
  }

  getSectorName(sectorId: number): string {
    return this.sectorMap.get(sectorId)
      ?? this.fallbackSectorNames[sectorId]
      ?? `Sector ${sectorId}`;
  }

  getSectorId(sectorName: string): number | null {
    const key = this.normalizeName(sectorName);
    return this.sectorIdMap.get(key)
      ?? this.fallbackSectorIds[key]
      ?? null;
  }
}
