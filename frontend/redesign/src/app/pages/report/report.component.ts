import { Component, OnInit, signal, computed, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReservationService } from '../../services/reservation.service';
import { Reservation, SECTORS, Sector, sectorSlug, SECTOR_ICONS } from '../../models/interfaces';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
})
export class ReportComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;

  sectors = SECTORS;
  sectorIcons = SECTOR_ICONS;
  sectorSlug = sectorSlug;

  search = signal('');
  sectorFilter = signal<Sector | ''>('');
  all = signal<Reservation[]>([]);

  // Animated count-ups
  totalC = signal(0);
  invC   = signal(0);
  roomsC = signal(0);
  presC  = signal(0);

  busiestSector = computed<string>(() => {
    const counts = new Map<Sector, number>();
    for (const r of this.all()) counts.set(r.sector, (counts.get(r.sector) ?? 0) + 1);
    let best: Sector | null = null, max = 0;
    counts.forEach((v, k) => { if (v > max) { max = v; best = k; } });
    return best ?? '—';
  });

  filtered = computed(() => {
    const term = this.search().toLowerCase().trim();
    const sec = this.sectorFilter();
    return this.all().filter(r =>
      (!term ||
        r.investorName.toLowerCase().includes(term) ||
        r.presenterName.toLowerCase().includes(term) ||
        r.hotelName.toLowerCase().includes(term) ||
        r.roomName.toLowerCase().includes(term)) &&
      (!sec || r.sector === sec)
    );
  });

  dataSource = new MatTableDataSource<Reservation>([]);
  displayedColumns = ['investorName', 'presenterName', 'sector', 'hotelName', 'roomName', 'slotDate', 'timeSlot', 'status', 'bookedAt'];

  uniqueInvestors = computed(() => new Set(this.all().map(r => r.investorId)).size);
  uniquePresenters = computed(() => new Set(this.all().map(r => r.presenterId)).size);
  uniqueRooms = computed(() => new Set(this.all().map(r => r.roomId)).size);

  private rafIds: number[] = [];

  constructor(private resSvc: ReservationService) {}

  ngOnInit() {
    this.resSvc.list().subscribe(r => {
      this.all.set(r);
      this.dataSource.data = this.filtered();
      this.runCountUps();
    });
  }

  ngAfterViewInit() { this.dataSource.sort = this.sort; }
  ngOnDestroy() { this.rafIds.forEach(id => cancelAnimationFrame(id)); }

  applyFilters() { this.dataSource.data = this.filtered(); }

  runCountUps() {
    this.animate(this.totalC, this.all().length);
    this.animate(this.invC,   this.uniqueInvestors());
    this.animate(this.presC,  this.uniquePresenters());
    this.animate(this.roomsC, this.uniqueRooms());
  }
  private animate(target: ReturnType<typeof signal<number>>, to: number, duration = 800) {
    const from = target();
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      target.set(Math.round(from + (to - from) * eased));
      if (t < 1) this.rafIds.push(requestAnimationFrame(tick));
    };
    this.rafIds.push(requestAnimationFrame(tick));
  }

  openSsrs() {
    window.open('http://localhost/ReportServer/Pages/ReportViewer?%2fEMS&rs:Command=ListChildren', '_blank');
  }

  exportCsv() {
    const rows = this.filtered();
    const headers = ['Investor', 'Presenter', 'Sector', 'Hotel', 'Room', 'Slot Date', 'Time Slot', 'Status', 'Booked At'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.investorName, r.presenterName, r.sector, r.hotelName, r.roomName, r.slotDate, r.timeSlot, r.status ?? '', r.bookedAt,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
