import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { filter, map, startWith } from 'rxjs';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  navItems: NavItem[] = [
    { path: '/admin/hotels',     label: 'Hotels',     icon: 'hotel' },
    { path: '/admin/investors',  label: 'Investors',  icon: 'groups' },
    { path: '/admin/presenters', label: 'Presenters', icon: 'record_voice_over' },
    { path: '/admin/report',     label: 'Report',     icon: 'insights' },
  ];

  collapsed   = signal(false);    // desktop collapse
  mobileOpen  = signal(false);
  isMobile    = signal(window.innerWidth < 900);
  pageTitle   = signal('EMS');
  showShell   = signal(false);

  @HostListener('window:resize')
  onResize() {
    const m = window.innerWidth < 900;
    this.isMobile.set(m);
    if (m) this.collapsed.set(false);
  }

  constructor(router: Router) {
    router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => router.url),
    ).subscribe(url => {
      const u = url.split('?')[0];
      const item = this.navItems.find(n => u.startsWith(n.path));
      this.pageTitle.set(item ? item.label : 'EMS');
      this.showShell.set(u.startsWith('/admin'));
      this.mobileOpen.set(false);
    });
  }

  toggleCollapse() { this.collapsed.update(v => !v); }
  toggleMobile()   { this.mobileOpen.update(v => !v); }
}
