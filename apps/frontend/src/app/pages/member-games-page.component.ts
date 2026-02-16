/**
 * File: apps\frontend\src\app\pages\member-games-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../core/api.service';
import { Game } from '../core/models';

/**
 * Pagina area MEMBER per consultare il catalogo giochi (`/app/catalogo-giochi`).
 * Mostra elenco dei giochi disponibili con metadati (categoria, range giocatori, eta, durata, stock).
 * Permette filtrare lato server tramite query `search` e `category`.
 * Usa `ApiService` per chiamare `GET /games` e popolare la griglia.
 * La UI evidenzia low stock per rendere immediata la disponibilita.
 * Carica i dati in `ngOnInit()` e consente refresh manuale con pulsante "Aggiorna".
 * Gestisce errori di rete mostrando feedback con `MatSnackBar`.
 * Assume che il backend applichi visibilita: MEMBER vede solo giochi `isActive=true`.
 * Riferimenti: `apps/backend/src/games/games.controller.ts` e `apps/backend/src/games/games.service.ts`.
 */
@Component({
  selector: 'app-member-games-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="page-header">
      <h2>Catalogo Giochi</h2>
      <p>Ricerca veloce dei giochi disponibili in ludoteca.</p>
    </section>

    <section class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Cerca titolo</mat-label>
        <input matInput [(ngModel)]="search" placeholder="Es. Catan" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Categoria</mat-label>
        <input matInput [(ngModel)]="category" placeholder="Es. Strategia" />
      </mat-form-field>

      <button mat-flat-button color="primary" (click)="loadGames()">Aggiorna</button>
    </section>

    <section class="games-grid">
      <mat-card class="game-card" *ngFor="let game of games">
        <h3>{{ game.title }}</h3>
        <p><strong>Categoria:</strong> {{ game.category }}</p>
        <p><strong>Giocatori:</strong> {{ game.minPlayers }} - {{ game.maxPlayers }}</p>
        <p><strong>Eta minima:</strong> {{ game.minAge }}+</p>
        <p><strong>Durata:</strong> {{ game.durationMin }} min</p>
        <p class="stock" [class.low-stock]="game.stockAvailable <= 1">
          Disponibili: {{ game.stockAvailable }} / {{ game.stockTotal }}
        </p>
      </mat-card>

      <p class="empty" *ngIf="games.length === 0">Nessun gioco trovato.</p>
    </section>
  `,
  styles: [
    `
      .page-header h2 {
        margin: 0;
        font-family: var(--font-display);
      }

      .page-header p {
        margin-top: 8px;
        color: #55697b;
      }

      .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        align-items: center;
        margin: 12px 0 16px;
      }

      .games-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
      }

      .game-card {
        border: 1px solid #dbe8f1;
      }

      .game-card h3 {
        margin: 0 0 6px;
      }

      .game-card p {
        margin: 4px 0;
        color: #344350;
      }

      .stock {
        margin-top: 10px;
        font-weight: 600;
      }

      .low-stock {
        color: #b24028;
      }

      .empty {
        grid-column: 1 / -1;
      }
    `,
  ],
})
export class MemberGamesPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  search = '';
  category = '';
  games: Game[] = [];

  /**
   * Caricamento iniziale catalogo.
   */
  ngOnInit(): void {
    this.loadGames();
  }

  /**
   * Richiama API giochi con filtri correnti.
   */
  loadGames() {
    this.api
      .get<Game[]>('/games', {
        search: this.search || undefined,
        category: this.category || undefined,
      })
      .subscribe({
        next: (games) => {
          this.games = games;
        },
        error: () => {
          this.snackBar.open('Errore nel caricamento giochi', 'Chiudi', {
            duration: 3000,
          });
        },
      });
  }
}
