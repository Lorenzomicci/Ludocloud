/**
 * File: apps\backend\src\bookings\bookings.controller.ts
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { BookingsService } from './bookings.service';
import { BookingsQueryDto } from './dto/bookings-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

/**
 * Controller REST per le prenotazioni (`/api/v1/bookings`).
 * Espone listing con scope dipendente dal ruolo: MEMBER vede solo le proprie, STAFF/ADMIN puo filtrare tutto.
 * Espone creazione prenotazione con payload validato da `CreateBookingDto`.
 * Espone cancellazione via `PATCH /bookings/:id/cancel` con policy temporale e ripristino stock giochi.
 * Usa `@CurrentUser()` per passare al service identita e ruolo dell'utente autenticato.
 * Non contiene regole di business: delega a `BookingsService` che applica tutte le constraint.
 * Le regole includono: slot fisso, orari apertura, capienza, limiti prenotazioni future, overlap tavolo, stock giochi.
 * Error handling e tramite eccezioni HTTP sollevate dal service (400/403/404/409).
 * I guard globali gestiscono autenticazione JWT e RBAC; alcuni comportamenti cambiano in base al ruolo.
 * Riferimenti: `bookings.service.ts`, `booking-rules.ts`, `tables.service.ts` (availability).
 */
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Elenco prenotazioni (scope dipende dal ruolo autenticato).
   */
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: BookingsQueryDto) {
    return this.bookingsService.list(user, query);
  }

  /**
   * Crea nuova prenotazione.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user, dto);
  }

  /**
   * Cancellazione prenotazione con policy temporale.
   */
  @Patch(':id/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bookingsService.cancel(user, id);
  }
}
