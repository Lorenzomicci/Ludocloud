/**
 * File: apps\frontend\src\app\pages\member-booking-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../core/api.service';
import { Game, TableModel } from '../core/models';

/**
 * Pagina area MEMBER per creare una prenotazione tavolo (`/app/prenota`).
 * Implementa form reattivo per scegliere startAt, tavolo, numero persone e note.
 * Applica UX: slot standard 90 minuti e precompila una data/ora di default (domani alle 18:00).
 * Calcola `endAt` automaticamente e ricarica disponibilita tavoli chiamando `GET /tables?startAt&endAt`.
 * Carica catalogo giochi per consentire associazione opzionale di giochi con quantita.
 * Costruisce `gameSelections` filtrando solo quantita > 0 e invia `POST /bookings`.
 * Dopo successo, notifica l'utente e ricarica la disponibilita; dopo errore mostra messaggio dal backend.
 * La coerenza regole (orari apertura, capienza, stock, overlap) e validata definitivamente dal backend.
 * Usa `ApiService` e Angular Material per integrare UI e chiamate REST.
 * Riferimenti: `apps/backend/src/bookings/dto/create-booking.dto.ts` e `apps/backend/src/bookings/bookings.service.ts#create`.
 */
@Component({
  selector: 'app-member-booking-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="page-header">
      <h2>Prenota Tavolo</h2>
      <p>Slot standard di 90 minuti, fascia 15:00-23:00.</p>
    </section>

    <mat-card class="booking-card">
      <form [formGroup]="form" (ngSubmit)="submit()" class="booking-form">
        <mat-form-field appearance="outline">
          <mat-label>Inizio prenotazione</mat-label>
          <input matInput type="datetime-local" formControlName="startAt" (change)="reloadAvailability()" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tavolo</mat-label>
          <mat-select formControlName="tableId">
            <mat-option *ngFor="let table of tables" [value]="table.id">
              {{ table.code }} - {{ table.zone }} ({{ table.capacity }} posti)
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Numero persone</mat-label>
          <input matInput type="number" formControlName="peopleCount" min="1" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="notes-field">
          <mat-label>Note</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>

        <div class="games-picker">
          <h3>Giochi da associare (opzionale)</h3>
          <div class="game-row" *ngFor="let game of games">
            <span>{{ game.title }} (disp: {{ game.stockAvailable }})</span>
              <input
              type="number"
              min="0"
              [max]="game.stockAvailable"
              [value]="quantities[game.id] || 0"
              (input)="setQty(game.id, $event)"
            />
          </div>
        </div>

        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Invio...' : 'Conferma prenotazione' }}
        </button>
      </form>
    </mat-card>
  `,
  styles: [
    `
      .page-header h2 {
        margin: 0;
        font-family: var(--font-display);
      }

      .booking-card {
        padding: 14px;
      }

      .booking-form {
        display: grid;
        gap: 10px;
      }

      .notes-field {
        grid-column: 1 / -1;
      }

      .games-picker {
        padding: 10px;
        border: 1px dashed #adc5d6;
        border-radius: 10px;
      }

      .games-picker h3 {
        margin: 0 0 8px;
        font-size: 1rem;
      }

      .game-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid #edf3f8;
      }

      .game-row input {
        width: 70px;
        padding: 4px;
      }
    `,
  ],
})
export class MemberBookingPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  loading = false;
  tables: TableModel[] = [];
  games: Game[] = [];
  quantities: Record<string, number> = {};

  readonly form = this.fb.nonNullable.group({
    startAt: [this.defaultStartAt(), [Validators.required]],
    tableId: ['', [Validators.required]],
    peopleCount: [4, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  /**
   * Bootstrap pagina: carica catalogo giochi e disponibilita tavoli.
   */
  ngOnInit(): void {
    this.loadGames();
    this.reloadAvailability();
  }

  /**
   * Carica i giochi attivi disponibili da associare alla prenotazione.
   */
  private loadGames() {
    this.api.get<Game[]>('/games').subscribe({
      next: (games) => {
        this.games = games;
      },
      error: () => {
        this.snackBar.open('Errore caricamento giochi', 'Chiudi', { duration: 3000 });
      },
    });
  }

  /**
   * Ricalcola i tavoli liberi in base allo slot selezionato.
   */
  reloadAvailability() {
    const startAt = this.form.getRawValue().startAt;
    const startDate = new Date(startAt);
    const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);

    this.api
      .get<TableModel[]>('/tables', {
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      })
      .subscribe({
        next: (tables) => {
          this.tables = tables.filter((table) => table.available !== false);
          const selected = this.form.getRawValue().tableId;
          if (selected && !this.tables.some((table) => table.id === selected)) {
            this.form.patchValue({ tableId: '' });
          }
        },
        error: () => {
          this.snackBar.open('Errore caricamento disponibilita tavoli', 'Chiudi', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Aggiorna quantita richiesta per un gioco nel form.
   */
  setQty(gameId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const qty = Number(input.value || 0);
    this.quantities[gameId] = Number.isFinite(qty) ? Math.max(0, qty) : 0;
  }

  /**
   * Crea prenotazione e invia eventuali giochi associati.
   */
  submit() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const value = this.form.getRawValue();
    const startAtDate = new Date(value.startAt);
    const endAtDate = new Date(startAtDate.getTime() + 90 * 60 * 1000);

    const gameSelections = Object.entries(this.quantities)
      .filter(([, qty]) => qty > 0)
      .map(([gameId, quantity]) => ({ gameId, quantity }));

    this.api
      .post('/bookings', {
        tableId: value.tableId,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        peopleCount: value.peopleCount,
        notes: value.notes || undefined,
        gameSelections,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Prenotazione confermata', 'OK', { duration: 3000 });
          this.quantities = {};
          this.reloadAvailability();
        },
        error: (error) => {
          this.loading = false;
          const message = error?.error?.message ?? 'Prenotazione fallita';
          this.snackBar.open(message, 'Chiudi', { duration: 3500 });
        },
      });
  }

  /**
   * Precompila data/ora iniziale di default per UX veloce.
   */
  private defaultStartAt(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(18, 0, 0, 0);
    return this.toInputDateTime(date);
  }

  /**
   * Converte Date in formato richiesto da input datetime-local.
   */
  private toInputDateTime(date: Date): string {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  }
}
