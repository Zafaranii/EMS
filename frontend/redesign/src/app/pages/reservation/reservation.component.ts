import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatNativeDateModule, MatDateFormats, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

import { InvestorService } from '../../services/investor.service';
import { PresenterService } from '../../services/presenter.service';
import { HotelService } from '../../services/hotel.service';
import { ReservationService } from '../../services/reservation.service';
import { Investor, Presenter, Hotel, Sector, SECTOR_ICONS, sectorSlug, Reservation } from '../../models/interfaces';
import { LoadingOverlayComponent } from '../../shared/loading-overlay.component';
import { burst } from '../../shared/confetti';

const DATE_FORMATS: MatDateFormats = {
  parse:   { dateInput: 'LL' },
  display: {
    dateInput: { year: 'numeric', month: 'short', day: 'numeric' } as Intl.DateTimeFormatOptions,
    monthYearLabel: { year: 'numeric', month: 'short' } as Intl.DateTimeFormatOptions,
    dateA11yLabel:  { year: 'numeric', month: 'long', day: 'numeric' } as Intl.DateTimeFormatOptions,
    monthYearA11yLabel: { year: 'numeric', month: 'long' } as Intl.DateTimeFormatOptions,
  },
};

type RoomCtx = {
  hotel: Hotel;
  roomId: string;
  roomName: string;
  slotId: string;
  slotDate: string;
  label: string;
  floor?: number;
  capacity?: number;
};

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
    MatIconModule, MatSnackBarModule, LoadingOverlayComponent,
  ],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: DATE_FORMATS }],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss'],
  animations: [
    trigger('stepSlide', [
      transition(':increment', [
        query(':enter, :leave', style({ position: 'absolute', top: 0, left: 0, right: 0 }), { optional: true }),
        group([
          query(':leave', [
            style({ opacity: 1, transform: 'translateX(0)' }),
            animate('260ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 0, transform: 'translateX(-40px)' })),
          ], { optional: true }),
          query(':enter', [
            style({ opacity: 0, transform: 'translateX(40px)' }),
            animate('260ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'translateX(0)' })),
          ], { optional: true }),
        ]),
      ]),
      transition(':decrement', [
        query(':enter, :leave', style({ position: 'absolute', top: 0, left: 0, right: 0 }), { optional: true }),
        group([
          query(':leave', [
            style({ opacity: 1, transform: 'translateX(0)' }),
            animate('260ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 0, transform: 'translateX(40px)' })),
          ], { optional: true }),
          query(':enter', [
            style({ opacity: 0, transform: 'translateX(-40px)' }),
            animate('260ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'translateX(0)' })),
          ], { optional: true }),
        ]),
      ]),
    ]),
  ],
})
export class ReservationComponent implements OnInit {
  sectorIcons = SECTOR_ICONS;
  sectorSlug = sectorSlug;

  investors  = signal<Investor[]>([]);
  presenters = signal<Presenter[]>([]);
  hotels     = signal<Hotel[]>([]);
  loading    = signal(false);

  step = signal(1);
  steps = [
    { n: 1, label: 'Select Investor' },
    { n: 2, label: 'Choose Sector & Time' },
    { n: 3, label: 'Pick Presenter' },
    { n: 4, label: 'Confirm Room' },
  ];

  investorSearch = signal('');
  selectedInvestor  = signal<Investor | null>(null);
  selectedSector    = signal<Sector | null>(null);
  selectedDate      = signal<Date | null>(null);
  selectedTime      = signal<string | null>(null);
  selectedPresenter = signal<Presenter | null>(null);
  selectedRoom      = signal<RoomCtx | null>(null);
  availablePresenterIds = signal<Set<string>>(new Set());
  availableRoomsData = signal<RoomCtx[]>([]);
  investorBookedTimes = signal<Set<string>>(new Set());

  success = signal<Reservation | null>(null);
  savedPresenter = signal<Presenter | null>(null);
  maxStep = signal(1);

  availableDatesByInvestor = computed<Set<string>>(() => {
    const inv = this.selectedInvestor();
    const sec = this.selectedSector();
    const hotels = this.hotels();
    if (!inv || !sec || hotels.length === 0) return new Set();

    const freeDates = new Set<string>();
    const sectorWindows = inv.availability.filter(a => a.sector === sec);

    for (const window of sectorWindows) {
      const startMin = this.timeStringToMinutes(window.start);
      const endMin = this.timeStringToMinutes(window.end);

      const hasBookableSlot = hotels.some(hotel =>
        hotel.rooms.some(room =>
          room.slots.some(slot => {
            if (slot.date !== window.availableDate || slot.booked) return false;
            const slotStart = this.timeStringToMinutes(slot.start);
            const slotEnd = this.timeStringToMinutes(slot.end);
            return slotStart >= startMin && slotEnd <= endMin;
          })
        )
      );

      if (hasBookableSlot) freeDates.add(window.availableDate);
    }

    return freeDates;
  });

  filteredInvestors = computed(() => {
    const q = this.investorSearch().trim().toLowerCase();
    if (!q) return this.investors();
    return this.investors().filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.availability.some(a => a.sector.toLowerCase().includes(q))
    );
  });

  availableSectors = computed(() => {
    const inv = this.selectedInvestor();
    if (!inv) return [];
    return Array.from(new Set(inv.availability.map(a => a.sector)));
  });

  uniqueSectors(availability: { sector: Sector }[]): Sector[] {
    return Array.from(new Set(availability.map(a => a.sector)));
  }

  hasRoomConfiguration = computed(() =>
    this.hotels().some(h => h.rooms.some(r => r.slots.length > 0))
  );

  calendarDateClass: MatCalendarCellClassFunction<Date> = (date, view) => {
    if (view !== 'month') return '';
    if (!this.selectedInvestor() || !this.selectedSector()) return '';
    return this.isDateAvailable(date) ? 'date-available' : 'date-unavailable';
  };

  slotOptions = computed<{
    time: string;
    available: boolean;
    totalRooms: number;
    freeRooms: number;
    bookedRooms: number;
    investorBlocked: boolean;
  }[]>(() => {
    if (!this.hasRoomConfiguration()) return [];
    const inv = this.selectedInvestor();
    const sec = this.selectedSector();
    const date = this.dateKey(this.selectedDate());
    const bookedTimes = this.investorBookedTimes();
    if (!inv || !sec || !date) return [];
    const windowsForDate = inv.availability.filter(a => a.sector === sec && a.availableDate === date);

    const slotMap = new Map<string, { totalRooms: number; freeRooms: number; bookedRooms: number; investorBlocked: boolean }>();

    for (const hotel of this.hotels()) {
      for (const room of hotel.rooms) {
        for (const slot of room.slots) {
          if (slot.date !== date) continue;

          const start = slot.start;
          const end = slot.end;
          const slotStartMin = this.timeStringToMinutes(start);
          const slotEndMin = this.timeStringToMinutes(end);
          const investorAvailable = windowsForDate.some(window => {
            const windowStart = this.timeStringToMinutes(window.start);
            const windowEnd = this.timeStringToMinutes(window.end);
            return slotStartMin >= windowStart && slotEndMin <= windowEnd;
          });

          if (!investorAvailable) continue;

          const investorAlreadyBooked = bookedTimes.has(start);

          const current = slotMap.get(start) ?? { totalRooms: 0, freeRooms: 0, bookedRooms: 0, investorBlocked: false };
          current.totalRooms += 1;
          if (investorAlreadyBooked) {
            current.investorBlocked = true;
            current.bookedRooms += 1;
          } else if (slot.booked) {
            current.bookedRooms += 1;
          } else if (investorAvailable) {
            current.freeRooms += 1;
            current.investorBlocked = false;
          }
          slotMap.set(start, current);
        }
      }
    }

    return Array.from(slotMap.entries())
      .sort((a, b) => this.timeStringToMinutes(a[0]) - this.timeStringToMinutes(b[0]))
      .map(([time, summary]) => ({
        time,
        available: summary.freeRooms > 0,
        totalRooms: summary.totalRooms,
        freeRooms: summary.freeRooms,
        bookedRooms: summary.bookedRooms,
        investorBlocked: summary.investorBlocked,
      }));
  });

  matchedPresenters = computed(() => {
    const ids = this.availablePresenterIds();
    if (!ids.size) return [];
    return this.presenters().filter(p => ids.has(p.id)).map(p => ({
      ...p,
      busy: false,
    }));
  });

  availableRooms = computed<RoomCtx[]>(() => this.availableRoomsData());

  canGoNext = computed(() => {
    switch (this.step()) {
      case 1: return !!this.selectedInvestor();
      case 2: return !!this.selectedSector() && !!this.selectedDate() && !!this.selectedTime();
      case 3: return !!this.selectedPresenter();
      case 4: return !!this.selectedRoom();
    }
    return false;
  });

  constructor(
    private investorSvc: InvestorService,
    private presenterSvc: PresenterService,
    private hotelSvc: HotelService,
    private resSvc: ReservationService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.investorSvc.list().subscribe(inv => this.investors.set(inv));
    this.presenterSvc.list().subscribe(pre => this.presenters.set(pre));
    this.hotelSvc.list().subscribe(h => this.hotels.set(h));
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  avatarHue(name: string): string {
    const hues = [0, 40, 100, 200, 280];
    const code = name.charCodeAt(0);
    const hue = hues[code % hues.length];
    return `hsl(${hue}, 70%, 50%)`;
  }

  dateKey(d: Date | null): string {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  hoursBetween(start: string, end: string): string[] {
    const startH = parseInt(start.match(/\d+/)?.[0] || '0', 10);
    const endH = parseInt(end.match(/\d+/)?.[0] || '0', 10);
    const fmt = (h: number) => {
      const suffix = h >= 12 ? 'PM' : 'AM';
      const display = h % 12 === 0 ? 12 : h % 12;
      return `${display}${suffix}`;
    };
    const arr = [];
    for (let h = startH; h < endH; h++) arr.push(fmt(h));
    return arr;
  }

  selectInvestor(i: Investor) {
    this.selectedInvestor.set(i);
    this.selectedSector.set(null);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.selectedPresenter.set(null);
    this.selectedRoom.set(null);
    this.availablePresenterIds.set(new Set());
    this.availableRoomsData.set([]);
  }

  selectSector(s: Sector) {
    this.selectedSector.set(s);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.selectedPresenter.set(null);
    this.selectedRoom.set(null);
    this.availablePresenterIds.set(new Set());
    this.availableRoomsData.set([]);
  }

  onDateChange(d: Date | null) {
    this.selectedDate.set(d);
    this.selectedTime.set(null);
    this.selectedPresenter.set(null);
    this.selectedRoom.set(null);
    this.availablePresenterIds.set(new Set());
    this.availableRoomsData.set([]);
    this.refreshInvestorBookedTimes();
  }

  selectTime(t: string, taken: boolean) {
    if (taken) return;
    if (this.investorBookedTimes().has(t)) return;
    if (t !== this.selectedTime()) {
      this.savedPresenter.set(null);
      this.selectedPresenter.set(null);
    }
    this.selectedTime.set(t);
    this.selectedRoom.set(null);
    this.refreshDynamicAvailability();
  }

  selectPresenter(p: Presenter) { this.selectedPresenter.set(p); }

  selectRoom(r: RoomCtx) { this.selectedRoom.set(r); }

  private refreshInvestorBookedTimes() {
    const inv = this.selectedInvestor();
    const date = this.dateKey(this.selectedDate());
    if (!inv || !date) {
      this.investorBookedTimes.set(new Set());
      return;
    }

    this.resSvc.getInvestorBookedStartTimes(inv.id, date).subscribe({
      next: (times) => this.investorBookedTimes.set(times),
      error: (err) => {
        this.investorBookedTimes.set(new Set());
        this.snack.open(err?.error?.message || err?.message || 'Could not load investor bookings', 'Close', { duration: 3000 });
      }
    });
  }

  private refreshDynamicAvailability() {
    const sector = this.selectedSector();
    const date = this.dateKey(this.selectedDate());
    const time = this.selectedTime();

    if (!sector || !date || !time) {
      this.availablePresenterIds.set(new Set());
      this.availableRoomsData.set([]);
      return;
    }

    this.availablePresenterIds.set(new Set());
    this.availableRoomsData.set([]);

    this.resSvc.getMatchingPresenterIds(sector, time, date).subscribe({
      next: (ids) => this.availablePresenterIds.set(ids),
      error: (err) => {
        this.availablePresenterIds.set(new Set());
        this.snack.open(err?.error?.message || err?.message || 'Could not load presenter availability', 'Close', { duration: 3000 });
      }
    });

    this.resSvc.getAvailableRoomsByTime(time, date).subscribe({
      next: (rows) => {
        const mapped = rows.map((row: any) => {
          const hotelId = row.hotelId?.toString?.() ?? '';
          const hotel = this.hotels().find(h => h.id === hotelId) ?? {
            id: hotelId,
            name: row.hotelName,
            address: '',
            rooms: [],
          };

          return {
            hotel,
            roomId: row.roomId?.toString?.() ?? '',
            roomName: row.roomName,
            slotId: row.slotId?.toString?.() ?? '',
            slotDate: row.slotDate,
            label: `${this.formatToDisplay(row.startTime)}–${this.formatToDisplay(row.endTime)}`,
          } as RoomCtx;
        });
        this.availableRoomsData.set(mapped);
      },
      error: (err) => {
        this.availableRoomsData.set([]);
        this.snack.open(err?.error?.message || err?.message || 'Could not load room availability', 'Close', { duration: 3000 });
      }
    });
  }

  private formatToDisplay(apiTime: string): string {
    const [hours] = (apiTime || '').split(':');
    const h = parseInt(hours, 10);
    if (Number.isNaN(h)) return apiTime;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}${suffix}`;
  }

  private timeStringToMinutes(timeStr: string): number {
    if (!timeStr) return 0;
    
    const ampmMatch = timeStr.match(/(\d+)(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const period = ampmMatch[2].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 60;
    }
    
    const timeMatch = timeStr.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      return hours * 60 + minutes;
    }
    
    return 0;
  }

  confirm() {
    const inv = this.selectedInvestor(), pre = this.selectedPresenter(),
          sec = this.selectedSector(),    room = this.selectedRoom();
    if (!inv || !pre || !sec || !room) return;

    const selectedTime = this.selectedTime();
    if (!selectedTime) return;

    this.loading.set(true);

    this.resSvc.getMatchingPresenterIds(sec, selectedTime, room.slotDate).subscribe({
      next: (presenterIds) => {
        if (!presenterIds.has(pre.id)) {
          this.loading.set(false);
          this.snack.open('Presenter is no longer available for this time. Please choose another presenter.', 'Close', { duration: 4000 });
          return;
        }

        this.resSvc.getAvailableRoomsByTime(selectedTime, room.slotDate).subscribe({
          next: (rooms) => {
            const slotStillAvailable = rooms.some(r => r.slotId?.toString?.() === room.slotId);
            if (!slotStillAvailable) {
              this.loading.set(false);
              this.snack.open('Selected room slot is no longer available. Please choose another slot.', 'Close', { duration: 4000 });
              return;
            }

            this.resSvc.add({
              investorId: inv.id, investorName: inv.name,
              presenterId: pre.id, presenterName: pre.name,
              sector: sec,
              hotelId: room.hotel.id, hotelName: room.hotel.name,
              roomId: room.roomId, roomName: room.roomName,
              slotId: room.slotId,
              slotDate: room.slotDate,
              timeSlot: room.label,
            }).subscribe({
              next: (created) => {
                this.hotelSvc.markSlotBooked(room.hotel.id, room.roomId, room.slotId);
                this.selectedRoom.set(null);
                this.refreshInvestorBookedTimes();
                this.refreshDynamicAvailability();
                this.loading.set(false);
                this.success.set(created);
                setTimeout(() => burst(), 50);
              },
              error: (err) => {
                this.loading.set(false);
                this.snack.open(
                  err?.error?.message || err?.message || 'Failed to confirm booking. Please try another slot.',
                  'Close',
                  { duration: 4000 }
                );
              }
            });
          },
          error: (err) => {
            this.loading.set(false);
            this.snack.open(err?.error?.message || err?.message || 'Could not verify room availability', 'Close', { duration: 4000 });
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(err?.error?.message || err?.message || 'Could not verify presenter availability', 'Close', { duration: 4000 });
      }
    });
  }

  next() {
    if (this.canGoNext()) {
      this.step.update(s => s + 1);
      this.maxStep.update(m => Math.max(m, this.step()));
    }
  }

  back() {
    this.step.update(s => Math.max(1, s - 1));
  }

  goTo(n: number) {
    if (n <= this.maxStep()) {
      this.step.set(n);
    }
  }

  reset() {
    this.step.set(1);
    this.investorSearch.set('');
    this.selectedInvestor.set(null);
    this.selectedSector.set(null);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
    this.selectedPresenter.set(null);
    this.selectedRoom.set(null);
    this.availablePresenterIds.set(new Set());
    this.availableRoomsData.set([]);
    this.investorBookedTimes.set(new Set());
    this.success.set(null);
    this.savedPresenter.set(null);
    this.maxStep.set(1);
  }

  isDateAvailable(date: Date): boolean {
    const dateStr = this.dateKey(date);
    return this.availableDatesByInvestor().has(dateStr);
  }
}
