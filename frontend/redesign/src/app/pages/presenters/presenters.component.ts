import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresenterService } from '../../services/presenter.service';
import { Presenter } from '../../models/interfaces';
import { PeopleFormComponent } from '../../shared/people-form.component';

@Component({
  selector: 'app-presenters',
  standalone: true,
  imports: [CommonModule, PeopleFormComponent],
  template: `
    <app-people-form
      label="Presenter"
      [items]="items()"
      [loading]="loading()"
      (saveEntity)="onSave($event)"
      (removeEntity)="onRemove($event)">
    </app-people-form>
  `,
})
export class PresentersComponent implements OnInit {
  items = signal<Presenter[]>([]);
  loading = signal(false);

  constructor(private svc: PresenterService) {}

  ngOnInit() { this.svc.list().subscribe(i => this.items.set(i)); }

  onSave(v: Omit<Presenter, 'id'>) {
    this.loading.set(true);
    this.svc.add(v).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        console.error('Failed to add presenter', err);
        this.loading.set(false);
        alert(err?.error?.message || 'Failed to add presenter. Please check your inputs.');
      }
    });
  }
  onRemove(id: string) {
    this.loading.set(true);
    this.svc.remove(id).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        console.error('Failed to remove presenter', err);
        this.loading.set(false);
        alert(err?.error?.message || 'Failed to delete presenter.');
      }
    });
  }
}
