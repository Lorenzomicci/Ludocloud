/**
 * File: apps\backend\src\app.controller.spec.ts
 * Scopo: unit test di esempio (starter NestJS) per mostrare come testare un Controller
 *        isolandolo dalle dipendenze tramite Dependency Injection (mock di AppService).
 *
 * Nota: la logica di dominio del progetto e nei moduli sotto `src/*`
 *       (es. `auth`, `bookings`, `games`, `members`, ...).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getHello: jest.fn(() => 'Hello World!'),
  };

  beforeEach(async () => {
    appServiceMock.getHello.mockClear();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
      expect(appServiceMock.getHello).toHaveBeenCalledTimes(1);
    });
  });
});
