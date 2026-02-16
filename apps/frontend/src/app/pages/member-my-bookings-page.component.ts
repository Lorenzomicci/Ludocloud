/**
 * File: apps\frontend\src\app\pages\member-my-bookings-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../core/api.service';
import { BookingModel } from '../core/models';

/**
 * Pagina area MEMBER per visualizzare prenotazioni personali (`/app/mie-prenotazioni`).
 * Recupera l'elenco chiamando `GET /bookings` (backend filtra automaticamente per utente autenticato).
 * Mostra tavolo, fascia oraria, numero persone, stato e giochi associati.
 * Implementa `canCancel()` client-side per mostrare il bottone solo se mancano >=2 ore allo start.
 * La regola e comunque ri-validata sul backend in `BookingsService.cancel` (single source of truth).
 * Permette cancellazione via `PATCH /bookings/:id/cancel` e ricarica lista dopo successo.
 * Fornisce utility `gameSummary()` per rendering compatto dell'elenco giochi.
 * Gestisce errori mostrando `MatSnackBar` con messaggi user-friendly.
 * Riferimenti: `apps/backend/src/bookings/bookings.controller.ts` e `apps/backend/src/bookings/bookings.service.ts#cancel`.
 */
@Component({
  selector: 'app-member-my-bookings-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatSnackBarModule],
  template: `
    <section class="page-header">
      <h2>Le Mie Prenotazioni</h2>
      <p>Storico e prenotazioni future.</p>
    </section>

    <section class="booking-list">
      <mat-card class="booking-item" *ngFor="let booking of bookings">
        <div class="booking-top">
          <h3>{{ booking.table.code }} - {{ booking.table.zone }}</h3>
          <span class="status" [class.cancelled]="booking.status === 'CANCELLED'">{{ booking.status }}</span>
        </div>
        <p>{{ booking.startAt | date: 'EEEE d MMMM, HH:mm' }} -> {{ booking.endAt | date: 'HH:mm' }}</p>
        <p>Persone: {{ booking.peopleCount }}</p>
        <p *ngIf="booking.games.length > 0">
          Giochi: {{ gameSummary(booking) }}
        </p>

        <button
          mat-stroked-button
          color="warn"
          *ngIf="canCancel(booking)"
          (click)="cancel(booking.id)"
        >
          Cancella prenotazione
        </button>
      </mat-card>

      <p *ngIf="bookings.length === 0">Nessuna prenotazione disponibile.</p>
    </section>
  `,
  styles: [
    `
      .booking-list {
        display: grid;
        gap: 10px;
      }

      .booking-item {
        border: 1px solid #dbe8f1;
      }

      .booking-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .booking-top h3 {
        margin: 0;
      }

      .status {
        font-size: 0.8rem;
        font-weight: 700;
        color: #0d7f43;
      }

      .status.cancelled {
        color: #af2c2c;
      }
    `,
  ],
})
export class MemberMyBookingsPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  bookings: BookingModel[] = [];

  /**
   * Caricamento iniziale delle prenotazioni utente.
   */
  ngOnInit(): void {
    this.loadBookings();
  }

  /**
   * Recupera elenco prenotazioni del membro autenticato.
   */
  loadBookings() {
    this.api.get<BookingModel[]>('/bookings').subscribe({
      next: (bookings) => {
        this.bookings = bookings;
      },
      error: () => {
        this.snackBar.open('Errore caricamento prenotazioni', 'Chiudi', { duration: 3000 });
      },
    });
  }

  /**
   * Verifica client-side se la cancellazione e ancora disponibile (>=2h prima).
   */
  canCancel(booking: BookingModel): boolean {
    if (booking.status === 'CANCELLED') {
      return false;
    }

    const limit = new Date(booking.startAt).getTime() - 2 * 60 * 60 * 1000;
    return Date.now() < limit;
  }

  /**
   * Utility di rendering elenco giochi associati.
   */
  gameSummary(booking: BookingModel): string {
    return booking.games.map((game) => `${game.title} x${game.quantity}`).join(', ');
  }

  /**
   * Invoca cancellazione prenotazione e ricarica lista.
   */
  cancel(bookingId: string) {
    this.api.patch(`/bookings/${bookingId}/cancel`, {}).subscribe({
      next: () => {
        this.snackBar.open('Prenotazione cancellata', 'OK', { duration: 3000 });
        this.loadBookings();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Cancellazione non riuscita';
        this.snackBar.open(message, 'Chiudi', { duration: 3500 });
      },
    });
  }
}
