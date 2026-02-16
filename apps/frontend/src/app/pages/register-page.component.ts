/**
 * File: apps\frontend\src\app\pages\register-page.component.ts
 */

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../core/auth.service';

/**
 * Pagina pubblica di registrazione membro della SPA (`/register`).
 * Implementa un form reattivo con validazione (nome min 3, email, password con pattern, telefono opzionale).
 * Invia i dati al backend tramite `AuthService.register()` con cookie credentials abilitati.
 * Il backend crea User+Member e restituisce access token, impostando anche refresh token in cookie HttpOnly.
 * In caso di successo effettua login automatico e reindirizza alla sezione membro (catalogo giochi).
 * In caso di errore mostra feedback con `MatSnackBar`.
 * Il pattern password e coerente con la validazione backend (`RegisterDto`).
 * Mantiene lo stato `loading` per disabilitare il submit durante la request.
 * Riferimenti: `apps/backend/src/auth/dto/register.dto.ts` e `core/auth.service.ts`.
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="auth-wrap">
      <mat-card class="auth-card">
        <h1>Registrazione Iscritto</h1>
        <p>Crea un account membro per prenotare tavoli e giochi.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Nome completo</mat-label>
            <input matInput formControlName="fullName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Telefono</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Registrazione...' : 'Crea account' }}
          </button>
        </form>

        <small>
          Hai gia un account?
          <a routerLink="/login">Accedi</a>
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
        max-width: 480px;
        padding: 20px;
      }

      .auth-form {
        display: grid;
        gap: 10px;
      }

      h1 {
        margin: 0;
        font-family: var(--font-display);
      }

      p {
        color: #4f6070;
        margin: 8px 0 20px;
      }
    `,
  ],
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  loading = false;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
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
  });

  /**
   * Registra nuovo membro e reindirizza alla sezione member.
   */
  submit() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigateByUrl('/app/catalogo-giochi');
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.message ?? 'Registrazione fallita';
        this.snackBar.open(message, 'Chiudi', { duration: 3500 });
      },
    });
  }
}
