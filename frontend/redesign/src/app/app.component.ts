import { Component, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { ShellComponent } from './layout/shell.component';
import { filter, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  template: `<div [@routeFade]="fadeTick()"><app-shell></app-shell></div>`,
  animations: [
    trigger('routeFade', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('220ms cubic-bezier(.2,.8,.2,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class AppComponent {
  fadeTick = signal(0);
  constructor(private router: Router, private title: Title) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
    ).subscribe(() => {
      const url = this.router.url.split('?')[0];
      this.fadeTick.update(v => v + 1);
      if (url === '/' || url === '') this.title.setTitle('EMS — Conference Booking');
      else if (url.startsWith('/reservation')) this.title.setTitle('New Reservation · EMS');
      else if (url.startsWith('/admin')) this.title.setTitle('Admin · EMS');
      else this.title.setTitle('EMS');
    });
  }
}
