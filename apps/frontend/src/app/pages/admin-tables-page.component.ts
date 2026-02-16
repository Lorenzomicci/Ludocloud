/**
 * File: apps\frontend\src\app\pages\admin-tables-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../core/api.service';
import { TableModel } from '../core/models';

/**
 * Pagina area ADMIN per gestione tavoli (`/app/admin/tavoli`).
 * Consente creare e modificare tavoli (codice, zona, capienza) e abilitarli/disabilitarli.
 * Mostra form e lista tavoli in layout a due colonne (responsive).
 * In modalita edit, popola form dal tavolo selezionato e usa `editId`.
 * Su submit, esegue `POST /tables` o `PATCH /tables/:id` tramite `ApiService`.
 * Usa `MatSlideToggle` per gestire `isActive` (soft disable, tavolo non prenotabile dai membri).
 * Dopo ogni operazione ricarica la lista e mostra feedback con `MatSnackBar`.
 * La sicurezza e gestita dal backend: solo ADMIN puo scrivere (RBAC).
 * La capienza influisce sulle regole di prenotazione lato backend.
 * Riferimenti: `apps/backend/src/tables/tables.controller.ts` e `apps/backend/src/tables/tables.service.ts`.
 */
@Component({
  selector: 'app-admin-tables-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="two-col">
      <mat-card>
        <h2>{{ editId ? 'Modifica tavolo' : 'Nuovo tavolo' }}</h2>

        <form [formGroup]="form" (ngSubmit)="submit()" class="grid-form">
          <mat-form-field appearance="outline"><mat-label>Codice</mat-label><input matInput formControlName="code" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Zona</mat-label><input matInput formControlName="zone" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Capienza</mat-label><input matInput type="number" formControlName="capacity" /></mat-form-field>
          <mat-slide-toggle formControlName="isActive">Tavolo attivo</mat-slide-toggle>

          <div class="actions-row">
            <button mat-flat-button color="primary" type="submit">{{ editId ? 'Aggiorna' : 'Crea' }}</button>
            <button mat-button type="button" *ngIf="editId" (click)="resetForm()">Annulla</button>
          </div>
        </form>
      </mat-card>

      <mat-card>
        <h2>Tavoli</h2>
        <div class="list">
          <div class="row" *ngFor="let table of tables">
            <div>
              <strong>{{ table.code }}</strong>
              <div>{{ table.zone }} � {{ table.capacity }} posti � {{ table.isActive ? 'ATTIVO' : 'DISATTIVO' }}</div>
            </div>
            <button mat-stroked-button (click)="edit(table)">Modifica</button>
          </div>
        </div>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .two-col {
        display: grid;
        gap: 10px;
      }

      @media (min-width: 980px) {
        .two-col {
          grid-template-columns: 1fr 1fr;
        }
      }

      .grid-form,
      .list {
        display: grid;
        gap: 8px;
      }

      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        border: 1px solid #e1ebf4;
        border-radius: 8px;
        gap: 8px;
      }
    `,
  ],
})
export class AdminTablesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  tables: TableModel[] = [];
  editId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    zone: ['', Validators.required],
    capacity: [4, Validators.required],
    isActive: [true, Validators.required],
  });

  /**
   * Caricamento iniziale tavoli.
   */
  ngOnInit(): void {
    this.loadTables();
  }

  /**
   * Recupera tavoli configurati.
   */
  loadTables() {
    this.api.get<TableModel[]>('/tables').subscribe((tables) => (this.tables = tables));
  }

  /**
   * Popola form con tavolo selezionato.
   */
  edit(table: TableModel) {
    this.editId = table.id;
    this.form.patchValue(table);
  }

  /**
   * Ripristina form in modalita creazione.
   */
  resetForm() {
    this.editId = null;
    this.form.reset({ code: '', zone: '', capacity: 4, isActive: true });
  }

  /**
   * Crea/aggiorna tavolo in base a editId.
   */
  submit() {
    if (this.form.invalid) {
      return;
    }

    const body = this.form.getRawValue();
    const request$ = this.editId
      ? this.api.patch(`/tables/${this.editId}`, body)
      : this.api.post('/tables', body);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Tavolo salvato', 'OK', { duration: 2500 });
        this.resetForm();
        this.loadTables();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'Operazione non riuscita', 'Chiudi', {
          duration: 3000,
        });
      },
    });
  }
}
