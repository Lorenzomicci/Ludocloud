/**
 * File: apps\frontend\src\app\pages\login-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../core/auth.service';

/**
 * Pagina pubblica di login della SPA (`/login`).
 * Implementa un form reattivo con validazione base (email valida, password min 8).
 * Invia le credenziali al backend tramite `AuthService.login()` e gestisce lo stato `loading`.
 * In caso di successo, salva sessione (token + user) e naviga alla home coerente col ruolo.
 * In caso di errore, mostra un messaggio utente tramite `MatSnackBar`.
 * Usa Angular Material per una UI consistente e responsive.
 * Non gestisce refresh token: il backend imposta un cookie HttpOnly automaticamente su login.
 * La route di destinazione post-login e calcolata da `authService.routeForCurrentRole()`.
 * Riferimenti: `core/auth.service.ts` e `apps/backend/src/auth/auth.controller.ts` (endpoint login).
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="auth-wrap">
      <mat-card class="auth-card">
        <h1>Accedi a LudoCloud</h1>
        <p>Gestione ludoteca cloud-native per iscritti, staff e admin.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Accesso in corso...' : 'Accedi' }}
          </button>
        </form>

        <small>
          Non hai un account?
          <a routerLink="/register">Registrati</a>
        </small>
      </mat-card>
    </section>
  `,
  styles: [
    `
      .auth-wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .auth-card {
        width: 100%;
        max-width: 440px;
        padding: 20px;
      }

      h1 {
        margin: 0;
        font-family: var(--font-display);
      }

      p {
        margin-top: 8px;
        margin-bottom: 20px;
        color: #4f6070;
      }

      .auth-form {
        display: grid;
        gap: 12px;
      }

      small {
        display: block;
        margin-top: 14px;
      }
    `,
  ],
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  loading = false;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /**
   * Invia il login e, in caso di successo, naviga alla dashboard coerente col ruolo.
   */
  submit() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.form.getRawValue().email, this.form.getRawValue().password).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigateByUrl(this.authService.routeForCurrentRole());
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message ?? 'Credenziali non valide';
        this.snackBar.open(message, 'Chiudi', { duration: 3500 });
      },
    });
  }
}
