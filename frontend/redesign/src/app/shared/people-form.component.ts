import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators, FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SECTORS, HOURS, Investor, Presenter, Sector, sectorSlug, SECTOR_ICONS } from '../models/interfaces';
import { LoadingOverlayComponent } from './loading-overlay.component';

type Entity = Investor | Presenter;

@Component({
  selector: 'app-people-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule,
    LoadingOverlayComponent,
  ],
  templateUrl: './people-form.component.html',
  styleUrls: ['./people-form.component.scss'],
  animations: [
    trigger('drawerSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('260ms cubic-bezier(.2,.8,.2,1)', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('220ms cubic-bezier(.2,.8,.2,1)', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('scrim', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('200ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class PeopleFormComponent implements OnInit {
  @Input() label = 'Investor';
  @Input() items: Entity[] = [];
  @Input() loading = false;
  @Output() saveEntity = new EventEmitter<Omit<Entity, 'id'>>();
  @Output() removeEntity = new EventEmitter<string>();

  sectors = SECTORS;
  sectorIcons = SECTOR_ICONS;
  sectorSlug = sectorSlug;
  hours = HOURS;

  drawerOpen = signal(false);
  search = signal('');
  sectorFilter = signal<Sector | ''>('');

  filtered(): Entity[] {
    const q = this.search().toLowerCase().trim();
    const sec = this.sectorFilter();
    return this.items.filter(it =>
      (!q || it.name.toLowerCase().includes(q) || it.mobile.includes(q)) &&
      (!sec || it.availability.some(a => a.sector === sec))
    );
  }

  form!: FormGroup;
  confirmDeleteId = signal<string | null>(null);

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\s()]{7,}$/)]],
      availability: this.fb.array([this.newRow()]),
    });
  }

  get availability(): FormArray { return this.form.get('availability') as FormArray; }
  rowGroup(i: number): FormGroup { return this.availability.at(i) as FormGroup; }

  newRow(): FormGroup {
    return this.fb.group({
      sector: ['', Validators.required],
      startDate: ['', Validators.required],
      start: ['', Validators.required],
    });
  }
  addRow() { this.availability.push(this.newRow()); }
  removeRow(i: number) { if (this.availability.length > 1) this.availability.removeAt(i); }

  toggleSectorInRow(i: number, s: Sector) {
    this.rowGroup(i).patchValue({ sector: s });
  }

  openDrawer() { this.drawerOpen.set(true); }
  closeDrawer() { this.drawerOpen.set(false); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    
    const formValue = this.form.value;
    const expandedAvailability = this.expandDateRanges(formValue.availability);
    
    const payload = {
      name: formValue.name,
      mobile: formValue.mobile,
      availability: expandedAvailability,
    };
    
    this.saveEntity.emit(payload as Omit<Entity, 'id'>);
    this.form.reset();
    this.availability.clear();
    this.availability.push(this.newRow());
    this.closeDrawer();
  }

  private expandDateRanges(rows: any[]): any[] {
    const expanded: any[] = [];
    
    for (const row of rows) {
      const startDate = new Date(row.startDate);
      // End time is always 1 hour after start time
      const startHourIdx = this.hours.indexOf(row.start);
      const endTime = startHourIdx >= 0 && startHourIdx < this.hours.length - 1
        ? this.hours[startHourIdx + 1]
        : row.start; // fallback if not found
      
      // For now, only expand for the start date (1-day availability window)
      expanded.push({
        sector: row.sector,
        availableDate: this.formatDate(startDate),
        start: row.start,
        end: endTime,
      });
    }
    
    return expanded;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  askDelete(id: string) { this.confirmDeleteId.set(id); }
  cancelDelete() { this.confirmDeleteId.set(null); }
  doDelete() {
    const id = this.confirmDeleteId();
    if (id) { this.removeEntity.emit(id); this.confirmDeleteId.set(null); }
  }

  initials(name: string): string {
    return name.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
  avatarHue(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `linear-gradient(135deg, hsl(${h} 70% 60%), hsl(${(h + 40) % 360} 75% 50%))`;
  }

  formatAvailabilityDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-').map(Number);
    if (!year || !month || !day) return date;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }

  isControlInvalid(group: FormGroup, controlName: string, errorName: string): boolean {
    const control = group.get(controlName);
    return !!control && control.hasError(errorName) && (control.touched || control.dirty || this.form?.touched);
  }
}
