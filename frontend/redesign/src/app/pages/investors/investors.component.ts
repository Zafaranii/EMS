import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvestorService } from '../../services/investor.service';
import { Investor } from '../../models/interfaces';
import { PeopleFormComponent } from '../../shared/people-form.component';

@Component({
  selector: 'app-investors',
  standalone: true,
  imports: [CommonModule, PeopleFormComponent],
  template: `
    <app-people-form
      label="Investor"
      [items]="items()"
      [loading]="loading()"
      (saveEntity)="onSave($event)"
      (removeEntity)="onRemove($event)">
    </app-people-form>
  `,
})
export class InvestorsComponent implements OnInit {
  items = signal<Investor[]>([]);
  loading = signal(false);

  constructor(private svc: InvestorService) {}

  ngOnInit() { this.svc.list().subscribe(i => this.items.set(i)); }

  onSave(v: Omit<Investor, 'id'>) {
    this.loading.set(true);
    this.svc.add(v).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        console.error('Failed to add investor', err);
        this.loading.set(false);
        alert(err?.error?.message || 'Failed to add investor. Please check your inputs.');
      }
    });
  }
  onRemove(id: string) {
    this.loading.set(true);
    this.svc.remove(id).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        console.error('Failed to remove investor', err);
        this.loading.set(false);
        alert(err?.error?.message || 'Failed to delete investor.');
      }
    });
  }
}
