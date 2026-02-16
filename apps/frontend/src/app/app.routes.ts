/**
 * File: apps\frontend\src\app\app.routes.ts
 */

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { ShellComponent } from './layout/shell.component';
import { AdminBookingsPageComponent } from './pages/admin-bookings-page.component';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page.component';
import { AdminGamesPageComponent } from './pages/admin-games-page.component';
import { AdminMembersPageComponent } from './pages/admin-members-page.component';
import { AdminTablesPageComponent } from './pages/admin-tables-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { MemberBookingPageComponent } from './pages/member-booking-page.component';
import { MemberGamesPageComponent } from './pages/member-games-page.component';
import { MemberMyBookingsPageComponent } from './pages/member-my-bookings-page.component';
import { RegisterPageComponent } from './pages/register-page.component';

export const routes: Routes = [
  // Redirect root -> login.
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  // Route pubbliche.
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  {
    path: 'app',
    component: ShellComponent,
    // Tutta l'area /app richiede autenticazione.
    canActivate: [authGuard],
    children: [
      // Sezione membro.
      {
        path: 'catalogo-giochi',
        component: MemberGamesPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['MEMBER'] },
      },
      {
        path: 'prenota',
        component: MemberBookingPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['MEMBER'] },
      },
      {
        path: 'mie-prenotazioni',
        component: MemberMyBookingsPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['MEMBER'] },
      },
      // Sezione staff/admin.
      {
        path: 'admin/dashboard',
        component: AdminDashboardPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'STAFF'] },
      },
      {
        path: 'admin/giochi',
        component: AdminGamesPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'STAFF'] },
      },
      {
        path: 'admin/tavoli',
        component: AdminTablesPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'admin/iscritti',
        component: AdminMembersPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'STAFF'] },
      },
      {
        path: 'admin/prenotazioni',
        component: AdminBookingsPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'STAFF'] },
      },
      // Default interno app.
      { path: '', pathMatch: 'full', redirectTo: 'catalogo-giochi' },
    ],
  },
  // Fallback globale.
  { path: '**', redirectTo: 'login' },
];
