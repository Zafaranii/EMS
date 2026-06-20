import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="show" class="loading-overlay" role="status" aria-live="polite">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .spinner {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 3px solid rgba(79, 70, 229, 0.18);
      border-top-color: var(--brand-500);
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoadingOverlayComponent {
  @Input() show = false;
}
