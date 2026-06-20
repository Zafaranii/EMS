import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    data: { title: 'Home' },
  },
  {
    path: 'reservation',
    loadComponent: () => import('./pages/reservation/reservation.component').then(m => m.ReservationComponent),
    data: { title: 'Reservation' },
  },
  {
    path: 'admin',
    children: [
      { path: '', redirectTo: 'hotels', pathMatch: 'full' },
      { path: 'hotels',     loadComponent: () => import('./pages/hotels/hotels.component').then(m => m.HotelsComponent),     data: { title: 'Hotels' } },
      { path: 'investors',  loadComponent: () => import('./pages/investors/investors.component').then(m => m.InvestorsComponent), data: { title: 'Investors' } },
      { path: 'presenters', loadComponent: () => import('./pages/presenters/presenters.component').then(m => m.PresentersComponent), data: { title: 'Presenters' } },
      { path: 'report',     loadComponent: () => import('./pages/report/report.component').then(m => m.ReportComponent),     data: { title: 'Report' } },
    ],
  },
  { path: 'hotels',     redirectTo: 'admin/hotels',     pathMatch: 'full' },
  { path: 'investors',  redirectTo: 'admin/investors',  pathMatch: 'full' },
  { path: 'presenters', redirectTo: 'admin/presenters', pathMatch: 'full' },
  { path: 'report',     redirectTo: 'admin/report',     pathMatch: 'full' },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
