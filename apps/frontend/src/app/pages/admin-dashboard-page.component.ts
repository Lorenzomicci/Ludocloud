/**
 * File: apps\frontend\src\app\pages\admin-dashboard-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../core/api.service';

/**
 * Pagina area STAFF/ADMIN: dashboard operativa (`/app/admin/dashboard`).
 * Mostra KPI rapidi (numero iscritti, giochi, prenotazioni, prenotazioni confermate).
 * Carica i dati con chiamate concorrenti usando `forkJoin` per ridurre tempi di attesa.
 * Usa `ApiService` per interrogare gli endpoint `/members`, `/games`, `/bookings`.
 * I permessi sono gestiti a livello routing/guard e backend (RBAC).
 * La pagina non modifica dati: e read-only e focalizzata su panoramica.
 * Le metriche sono calcolate client-side in modo semplice (lunghezze array, filter status).
 * In una versione evoluta potrebbe avere endpoint KPI dedicati o visualizzazioni piu avanzate.
 * Riferimenti: `apps/backend/src/members/members.service.ts#list` e `apps/backend/src/bookings/bookings.service.ts#list`.
 */
@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <section class="page-header">
      <h2>Dashboard Operativa</h2>
      <p>Panoramica rapida su iscritti, giochi e prenotazioni.</p>
    </section>

    <section class="stats-grid">
      <mat-card>
        <h3>Iscritti</h3>
        <p>{{ membersCount }}</p>
      </mat-card>
      <mat-card>
        <h3>Giochi</h3>
        <p>{{ gamesCount }}</p>
      </mat-card>
      <mat-card>
        <h3>Prenotazioni</h3>
        <p>{{ bookingsCount }}</p>
      </mat-card>
      <mat-card>
        <h3>Confermate</h3>
        <p>{{ confirmedCount }}</p>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .stats-grid {
        margin-top: 12px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 10px;
      }

      mat-card {
        text-align: center;
      }

      h3 {
        margin: 0;
        font-size: 0.9rem;
      }

      p {
        margin: 10px 0 0;
        font-size: 2rem;
        color: #1f5270;
        font-family: var(--font-display);
      }
    `,
  ],
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly api = inject(ApiService);

  membersCount = 0;
  gamesCount = 0;
  bookingsCount = 0;
  confirmedCount = 0;

  /**
   * Carica KPI principali con una chiamata concorrente (forkJoin).
   */
  ngOnInit(): void {
    forkJoin({
      members: this.api.get<any[]>('/members'),
      games: this.api.get<any[]>('/games'),
      bookings: this.api.get<any[]>('/bookings'),
    }).subscribe(({ members, games, bookings }) => {
      this.membersCount = members.length;
      this.gamesCount = games.length;
      this.bookingsCount = bookings.length;
      this.confirmedCount = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
    });
  }
}
