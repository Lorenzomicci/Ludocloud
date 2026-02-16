/**
 * File: apps\frontend\src\app\pages\admin-members-page.component.ts
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
import { MemberModel } from '../core/models';

/**
 * Pagina area STAFF/ADMIN per gestione iscritti (`/app/admin/iscritti`).
 * Permette creare un nuovo iscritto (account MEMBER) da backoffice.
 * Mostra elenco iscritti con email, membership code e stato account (ACTIVE/SUSPENDED).
 * Consente cambiare stato tramite select e invio `PATCH /members/:id/status`.
 * Usa form reattivo con stessa policy password del backend (pattern + min length).
 * Dopo creazione o cambio stato, ricarica elenco per mantenere UI consistente.
 * Gestisce errori con `MatSnackBar` mostrando messaggi provenienti dal backend.
 * Il backend esegue hash password (Argon2) e audit delle operazioni, non il frontend.
 * Riferimenti: `apps/backend/src/members/members.controller.ts` e `apps/backend/src/members/members.service.ts`.
 */
@Component({
  selector: 'app-admin-members-page',
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
    <section class="two-col">
      <mat-card>
        <h2>Nuovo iscritto</h2>

        <form [formGroup]="form" (ngSubmit)="createMember()" class="grid-form">
          <mat-form-field appearance="outline"><mat-label>Nome completo</mat-label><input matInput formControlName="fullName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Telefono</mat-label><input matInput formControlName="phone" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Note</mat-label><input matInput formControlName="notes" /></mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Crea iscritto</button>
        </form>
      </mat-card>

      <mat-card>
        <h2>Elenco iscritti</h2>
        <div class="list">
          <div class="row" *ngFor="let member of members">
            <div>
              <strong>{{ member.user.fullName }}</strong>
              <div>{{ member.user.email }} � {{ member.membershipCode }} � {{ member.user.status }}</div>
            </div>
            <mat-form-field appearance="outline" class="status-field">
              <mat-label>Stato</mat-label>
              <mat-select [value]="member.user.status" (selectionChange)="changeStatus(member.id, $event.value)">
                <mat-option value="ACTIVE">ACTIVE</mat-option>
                <mat-option value="SUSPENDED">SUSPENDED</mat-option>
              </mat-select>
            </mat-form-field>
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
        gap: 8px;
        padding: 8px;
        border: 1px solid #e1ebf4;
        border-radius: 8px;
      }

      .status-field {
        width: 150px;
      }
    `,
  ],
})
export class AdminMembersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  members: MemberModel[] = [];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/),
      ],
    ],
    notes: [''],
  });

  /**
   * Caricamento iniziale elenco iscritti.
   */
  ngOnInit(): void {
    this.loadMembers();
  }

  /**
   * Recupera membri per pannello staff/admin.
   */
  loadMembers() {
    this.api.get<MemberModel[]>('/members').subscribe((members) => (this.members = members));
  }

  /**
   * Crea nuovo iscritto.
   */
  createMember() {
    if (this.form.invalid) {
      return;
    }

    this.api.post('/members', this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Iscritto creato', 'OK', { duration: 2500 });
        this.form.reset({ fullName: '', email: '', phone: '', password: '', notes: '' });
        this.loadMembers();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'Creazione fallita', 'Chiudi', {
          duration: 3000,
        });
      },
    });
  }

  /**
   * Aggiorna stato ACTIVE/SUSPENDED.
   */
  changeStatus(memberId: string, status: 'ACTIVE' | 'SUSPENDED') {
    this.api.patch(`/members/${memberId}/status`, { status }).subscribe({
      next: () => {
        this.snackBar.open('Stato aggiornato', 'OK', { duration: 2500 });
        this.loadMembers();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message ?? 'Aggiornamento fallito', 'Chiudi', {
          duration: 3000,
        });
      },
    });
  }
}
