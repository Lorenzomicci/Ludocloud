/**
 * File: apps\frontend\src\app\pages\admin-bookings-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../core/api.service';
import { BookingModel } from '../core/models';

/**
 * Pagina area STAFF/ADMIN per gestione prenotazioni (`/app/admin/prenotazioni`).
 * Fornisce filtri rapidi per stato e intervallo temporale (from/to in formato ISO).
 * Chiama `GET /bookings` passando i parametri query per ottenere dataset completo (non solo user).
 * Visualizza informazioni chiave: membro, tavolo, fascia oraria, persone e numero giochi associati.
 * Permette cancellazione operativa via `PATCH /bookings/:id/cancel` anche per prenotazioni altrui.
 * Il backend applica comunque le regole (finestra cancellazione) e gestisce stock giochi in transazione.
 * Usa `ApiService` e `MatSnackBar` per feedback e gestione errori.
 * Carica automaticamente le prenotazioni al `ngOnInit()` per mostrare subito dati.
 * Riferimenti: `apps/backend/src/bookings/bookings.service.ts#list` e `apps/backend/src/bookings/bookings.service.ts#cancel`.
 */
@Component({
  selector: 'app-admin-bookings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="page-header">
      <h2>Gestione Prenotazioni</h2>
      <p>Filtro rapido e cancellazione staff/admin.</p>
    </section>

    <section class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Stato</mat-label>
        <mat-select [(ngModel)]="status">
          <mat-option value="">Tutti</mat-option>
          <mat-option value="CONFIRMED">CONFIRMED</mat-option>
          <mat-option value="PENDING">PENDING</mat-option>
          <mat-option value="CANCELLED">CANCELLED</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Da (ISO)</mat-label>
        <input matInput [(ngModel)]="from" placeholder="2026-02-13T00:00:00.000Z" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>A (ISO)</mat-label>
        <input matInput [(ngModel)]="to" placeholder="2026-02-28T23:59:59.000Z" />
      </mat-form-field>

      <button mat-flat-button color="primary" (click)="loadBookings()">Filtra</button>
    </section>

    <section class="list">
      <mat-card *ngFor="let booking of bookings" class="booking-row">
        <div class="top-row">
          <strong>{{ booking.member.fullName }} - {{ booking.table.code }}</strong>
          <span>{{ booking.status }}</span>
        </div>

        <p>{{ booking.startAt | date: 'd MMM, HH:mm' }} -> {{ booking.endAt | date: 'HH:mm' }}</p>
        <p>Persone: {{ booking.peopleCount }} � Giochi: {{ booking.games.length }}</p>

        <button
          mat-stroked-button
          color="warn"
          *ngIf="booking.status !== 'CANCELLED'"
          (click)="cancel(booking.id)"
        >
          Cancella
        </button>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .filters {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        align-items: center;
      }

      .list {
        margin-top: 12px;
        display: grid;
        gap: 8px;
      }

      .top-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
    `,
  ],
})
export class AdminBookingsPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  bookings: BookingModel[] = [];
  status = '';
  from = '';
  to = '';

  /**
   * Caricamento iniziale prenotazioni.
   */
  ngOnInit(): void {
    this.loadBookings();
  }

  /**
   * Recupera prenotazioni con filtri opzionali.
   */
  loadBookings() {
    this.api
      .get<BookingModel[]>('/bookings', {
        status: this.status || undefined,
        from: this.from || undefined,
        to: this.to || undefined,
      })
      .subscribe({
        next: (bookings) => {
          this.bookings = bookings;
        },
        error: () => {
          this.snackBar.open('Errore caricamento prenotazioni', 'Chiudi', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Cancella prenotazione (ruolo staff/admin).
   */
  cancel(bookingId: string) {
    this.api.patch(`/bookings/${bookingId}/cancel`, {}).subscribe({
      next: () => {
        this.snackBar.open('Prenotazione cancellata', 'OK', { duration: 2500 });
        this.loadBookings();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'Cancellazione fallita', 'Chiudi', {
          duration: 3000,
        });
      },
    });
  }
}
