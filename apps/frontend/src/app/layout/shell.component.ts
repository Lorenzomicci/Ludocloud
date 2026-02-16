/**
 * File: apps\frontend\src\app\layout\shell.component.ts
 * Scopo: componente applicativa di LudoCloud (annotato per preparazione orale).
 */

import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../core/auth.service';

/**
 * Componente di layout ("shell") dell'area autenticata della SPA.
 * Fornisce toolbar + sidenav con navigazione contestuale in base al ruolo (MEMBER vs STAFF/ADMIN).
 * Ospita un `router-outlet` interno per renderizzare le pagine figlie sotto `/app/*`.
 * Mostra informazioni utente (nome e ruolo) lette da `AuthService` tramite computed signals.
 * Espone helper `isMember()` e `isStaffOrAdmin()` per mostrare/nascondere link di menu (RBAC UI).
 * Centralizza l'azione di logout dalla toolbar delegando a `AuthService.logout()`.
 * E un componente standalone e importa i moduli Angular Material necessari al layout.
 * Migliora UX su mobile con sidenav "over" e comportamento responsive via CSS.
 * Non contiene logica di business: gestisce solo navigazione e composizione dell'interfaccia.
 * Riferimenti: `core/auth.service.ts` e `app.routes.ts` (route protette).
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #drawer mode="over" class="shell-sidenav">
        <mat-nav-list>
          <a mat-list-item routerLink="/app/catalogo-giochi" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isMember()">
            Catalogo giochi
          </a>
          <a mat-list-item routerLink="/app/prenota" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isMember()">
            Prenota tavolo
          </a>
          <a mat-list-item routerLink="/app/mie-prenotazioni" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isMember()">
            Le mie prenotazioni
          </a>

          <a mat-list-item routerLink="/app/admin/dashboard" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isStaffOrAdmin()">
            Dashboard
          </a>
          <a mat-list-item routerLink="/app/admin/giochi" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isStaffOrAdmin()">
            Gestione giochi
          </a>
          <a mat-list-item routerLink="/app/admin/tavoli" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isStaffOrAdmin()">
            Gestione tavoli
          </a>
          <a mat-list-item routerLink="/app/admin/iscritti" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isStaffOrAdmin()">
            Gestione iscritti
          </a>
          <a mat-list-item routerLink="/app/admin/prenotazioni" routerLinkActive="active-link" (click)="drawer.close()" *ngIf="isStaffOrAdmin()">
            Prenotazioni
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="shell-toolbar">
          <button mat-icon-button aria-label="Apri menu" (click)="drawer.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="brand">LudoCloud</span>
          <span class="spacer"></span>
          <span class="user-chip">{{ userName() }} � {{ userRole() }}</span>
          <button mat-flat-button color="accent" (click)="logout()">Esci</button>
        </mat-toolbar>

        <main class="shell-main">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell-container {
        height: 100vh;
        background: var(--surface-1);
      }

      .shell-toolbar {
        position: sticky;
        top: 0;
        z-index: 20;
        background: linear-gradient(90deg, #1f3a5f, #2b6f8f);
        color: #fff;
      }

      .shell-sidenav {
        width: 280px;
        background: #f7fbff;
      }

      .brand {
        margin-left: 12px;
        font-family: var(--font-display);
        letter-spacing: 0.06em;
        font-size: 1.05rem;
      }

      .spacer {
        flex: 1;
      }

      .user-chip {
        margin-right: 12px;
        font-size: 0.85rem;
        opacity: 0.95;
      }

      .shell-main {
        padding: 16px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .active-link {
        color: #0f5f83;
        font-weight: 600;
      }

      @media (max-width: 700px) {
        .user-chip {
          display: none;
        }

        .shell-main {
          padding: 12px;
        }
      }
    `,
  ],
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly userName = computed(() => this.authService.user()?.fullName ?? 'Utente');
  readonly userRole = computed(() => this.authService.user()?.role ?? 'GUEST');

  /**
   * Mostra menu navigazione membro.
   */
  isMember() {
    return this.authService.hasAnyRole(['MEMBER']);
  }

  /**
   * Mostra menu amministrativo.
   */
  isStaffOrAdmin() {
    return this.authService.hasAnyRole(['STAFF', 'ADMIN']);
  }

  /**
   * Esegue logout utente da toolbar.
   */
  logout() {
    this.authService.logout().subscribe();
  }
}
