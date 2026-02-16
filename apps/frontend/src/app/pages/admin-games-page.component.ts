/**
 * File: apps\frontend\src\app\pages\admin-games-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../core/api.service';
import { Game } from '../core/models';

/**
 * Pagina area STAFF/ADMIN per gestione catalogo giochi (`/app/admin/giochi`).
 * Mostra due colonne: form di creazione/modifica e lista giochi esistenti.
 * Usa un form reattivo per inserire metadati e inventario (stock totale/disponibile).
 * In modalita edit, carica i valori del gioco selezionato nel form e salva `editId`.
 * Su submit, esegue `POST /games` (create) oppure `PATCH /games/:id` (update).
 * Ricarica la lista dopo ogni operazione e mostra feedback con `MatSnackBar`.
 * La logica di autorizzazione e sul backend tramite `@Roles(STAFF, ADMIN)` e guard globali.
 * Il backend valida coerenza stock e risponde con errori significativi (400/404).
 * Riferimenti: `apps/backend/src/games/games.controller.ts` e `apps/backend/src/games/games.service.ts`.
 */
@Component({
  selector: 'app-admin-games-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="two-col">
      <mat-card>
        <h2>{{ editId ? 'Modifica gioco' : 'Nuovo gioco' }}</h2>

        <form [formGroup]="form" (ngSubmit)="submit()" class="grid-form">
          <mat-form-field appearance="outline"><mat-label>Titolo</mat-label><input matInput formControlName="title" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><input matInput formControlName="category" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Min giocatori</mat-label><input matInput type="number" formControlName="minPlayers" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Max giocatori</mat-label><input matInput type="number" formControlName="maxPlayers" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Eta minima</mat-label><input matInput type="number" formControlName="minAge" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Durata (min)</mat-label><input matInput type="number" formControlName="durationMin" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Stock totale</mat-label><input matInput type="number" formControlName="stockTotal" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Stock disponibile</mat-label><input matInput type="number" formControlName="stockAvailable" /></mat-form-field>

          <div class="actions-row">
            <button mat-flat-button color="primary" type="submit">{{ editId ? 'Aggiorna' : 'Crea' }}</button>
            <button mat-button type="button" *ngIf="editId" (click)="resetForm()">Annulla</button>
          </div>
        </form>
      </mat-card>

      <mat-card>
        <h2>Catalogo</h2>
        <div class="list">
          <div class="row" *ngFor="let game of games">
            <div>
              <strong>{{ game.title }}</strong>
              <div>{{ game.category }} � {{ game.stockAvailable }}/{{ game.stockTotal }}</div>
            </div>
            <button mat-stroked-button (click)="edit(game)">Modifica</button>
          </div>
        </div>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .two-col {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }

      @media (min-width: 980px) {
        .two-col {
          grid-template-columns: 1fr 1fr;
        }
      }

      .grid-form {
        display: grid;
        gap: 8px;
      }

      .actions-row {
        display: flex;
        gap: 8px;
      }

      .list {
        display: grid;
        gap: 8px;
      }

      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border: 1px solid #e1ebf4;
        border-radius: 8px;
      }
    `,
  ],
})
export class AdminGamesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  games: Game[] = [];
  editId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: ['', Validators.required],
    minPlayers: [2, Validators.required],
    maxPlayers: [4, Validators.required],
    minAge: [8, Validators.required],
    durationMin: [60, Validators.required],
    stockTotal: [1, Validators.required],
    stockAvailable: [1, Validators.required],
  });

  /**
   * Caricamento iniziale catalogo giochi.
   */
  ngOnInit(): void {
    this.loadGames();
  }

  /**
   * Recupera giochi lato admin/staff.
   */
  loadGames() {
    this.api.get<Game[]>('/games').subscribe((games) => (this.games = games));
  }

  /**
   * Porta i dati del gioco selezionato nel form edit.
   */
  edit(game: Game) {
    this.editId = game.id;
    this.form.patchValue(game);
  }

  /**
   * Ripristina form allo stato creazione.
   */
  resetForm() {
    this.editId = null;
    this.form.reset({
      title: '',
      category: '',
      minPlayers: 2,
      maxPlayers: 4,
      minAge: 8,
      durationMin: 60,
      stockTotal: 1,
      stockAvailable: 1,
    });
  }

  /**
   * Crea o aggiorna gioco in base a editId.
   */
  submit() {
    if (this.form.invalid) {
      return;
    }

    const body = this.form.getRawValue();
    const request$ = this.editId
      ? this.api.patch(`/games/${this.editId}`, body)
      : this.api.post('/games', body);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Salvataggio gioco completato', 'OK', { duration: 2500 });
        this.resetForm();
        this.loadGames();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Operazione non riuscita';
        this.snackBar.open(message, 'Chiudi', { duration: 3000 });
      },
    });
  }
}
