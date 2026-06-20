import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '../../services/hotel.service';
import { Hotel, HOURS } from '../../models/interfaces';
import { LoadingOverlayComponent } from '../../shared/loading-overlay.component';

@Component({
  selector: 'app-hotels',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatExpansionModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatIconModule,
    LoadingOverlayComponent,
  ],
  templateUrl: './hotels.component.html',
  styleUrls: ['./hotels.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: 0, transform: 'translateY(-6px)' }),
        animate('220ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, height: '*', transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 0, height: 0, transform: 'translateY(-6px)' })),
      ]),
    ]),
  ],
})
export class HotelsComponent implements OnInit {
  hours = HOURS;
  hotels = signal<Hotel[]>([]);
  loading = signal(false);

  showHotelForm = signal(false);
  showRoomForFor = signal<string | null>(null);   // hotelId
  showSlotForFor = signal<string | null>(null);   // roomId

  confirmDelete = signal<{ kind: 'hotel'|'room'|'slot'; ids: string[] } | null>(null);

  hotelForm: FormGroup;
  roomForms: Record<string, FormGroup> = {};
  slotForms: Record<string, FormGroup> = {};

  constructor(private fb: FormBuilder, private hotelSvc: HotelService) {
    this.hotelForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.hotelSvc.list().subscribe(hs => {
      this.hotels.set(hs);
      hs.forEach(h => {
        if (!this.roomForms[h.id]) {
          this.roomForms[h.id] = this.fb.group({
            name: ['', Validators.required],
            floor: [null],
          });
        }
        h.rooms.forEach(r => {
          if (!this.slotForms[r.id]) {
            this.slotForms[r.id] = this.fb.group({
              date: [null, Validators.required],
              start: ['', Validators.required],
              end:   ['', Validators.required],
            });
          }
        });
      });
    });
  }

  dateKey(d: Date | string | null): string {
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    const y = dt.getFullYear(), m = (dt.getMonth() + 1).toString().padStart(2, '0'), dd = dt.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  addHotel() {
    if (this.hotelForm.invalid) return;
    this.loading.set(true);
    const { name, address } = this.hotelForm.value;
    this.hotelSvc.addHotel(name!, address!).subscribe(() => {
      this.hotelForm.reset();
      this.showHotelForm.set(false);
      this.loading.set(false);
    });
  }

  addRoom(hotelId: string) {
    const form = this.roomForms[hotelId];
    if (!form || form.invalid) return;
    this.loading.set(true);
    this.hotelSvc.addRoom(hotelId, form.value.name!, form.value.floor ?? undefined)
      .subscribe(() => { form.reset(); this.showRoomForFor.set(null); this.loading.set(false); });
  }

  addSlot(hotelId: string, roomId: string) {
    const form = this.slotForms[roomId];
    if (!form || form.invalid) return;
    const start = form.value.start;
    const end = form.value.end;
    if (!start || !end || start === end) return;
    this.loading.set(true);
    this.hotelSvc.addSlot(hotelId, roomId, this.dateKey(form.value.date), form.value.start!, form.value.end!)
      .subscribe(() => { form.reset(); this.showSlotForFor.set(null); this.loading.set(false); });
  }

  toggleHotelForm() { this.showHotelForm.update(v => !v); }

  askDelete(kind: 'hotel'|'room'|'slot', ids: string[]) { this.confirmDelete.set({ kind, ids }); }
  cancelDelete() { this.confirmDelete.set(null); }
  doDelete() {
    const d = this.confirmDelete();
    if (!d) return;
    this.loading.set(true);
    const done = () => { this.confirmDelete.set(null); this.loading.set(false); };
    if (d.kind === 'hotel') this.hotelSvc.removeHotel(d.ids[0]).subscribe(done);
    if (d.kind === 'room')  this.hotelSvc.removeRoom(d.ids[0], d.ids[1]).subscribe(done);
    if (d.kind === 'slot')  this.hotelSvc.removeSlot(d.ids[0], d.ids[1], d.ids[2]).subscribe(done);
  }
}
