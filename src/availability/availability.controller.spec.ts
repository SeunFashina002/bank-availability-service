import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { TransactionsService } from '../transactions/transactions.service';
import {
  BankAvailability,
  ConfidenceLevel,
  StatusCode,
} from '../common/interfaces/transaction.interface';

describe('AvailabilityController (e2e)', () => {
  let app: INestApplication;
  let mockAvailabilityService: jest.Mocked<AvailabilityService>;
  let mockTransactionsService: jest.Mocked<TransactionsService>;

  const sampleAvailability: BankAvailability = {
    bank_code: 'BANK_A',
    availability_percentage: 80,
    confidence_level: ConfidenceLevel.HIGH,
    time_window: '1h',
    last_calculated_at: new Date().toISOString(),
    total_transactions_in_window: 10,
    status_counts: {
      [StatusCode.SUCCESS]: 8,
      [StatusCode.UNAVAILABLE]: 2,
    },
  };

  beforeEach(async () => {
    mockAvailabilityService = {
      calculateBankAvailability: jest.fn(),
      getAllBanksAvailability: jest.fn(),
      getBankAvailability: jest.fn(),
    } as any;
    mockTransactionsService = {
      getAllTransactions: jest.fn(),
      generateSampleTransactionsData: jest.fn(),
    } as any;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        { provide: AvailabilityService, useValue: mockAvailabilityService },
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /banks/:bank_code/availability', () => {
    it('should return bank availability for a valid bank', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([{} as any]);
      mockAvailabilityService.calculateBankAvailability.mockResolvedValue(
        sampleAvailability,
      );

      const res = await request(app.getHttpServer())
        .get('/banks/BANK_A/availability?window=1h')
        .expect(200);

      expect(res.body.bank_code).toBe('BANK_A');
      expect(res.body.availability_percentage).toBe(80);
      expect(
        mockAvailabilityService.calculateBankAvailability,
      ).toHaveBeenCalledWith('BANK_A', 1);
    });

    it('should generate sample data if no transactions exist', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([]);
      mockTransactionsService.generateSampleTransactionsData.mockResolvedValue(
        [],
      );
      mockAvailabilityService.calculateBankAvailability.mockResolvedValue(
        sampleAvailability,
      );

      await request(app.getHttpServer())
        .get('/banks/BANK_A/availability?window=1h')
        .expect(200);

      expect(
        mockTransactionsService.generateSampleTransactionsData,
      ).toHaveBeenCalledWith(1);
    });

    it('should return 404 if no data is available for the bank', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([{} as any]);
      mockAvailabilityService.calculateBankAvailability.mockResolvedValue({
        ...sampleAvailability,
        total_transactions_in_window: 0,
      });

      const res = await request(app.getHttpServer())
        .get('/banks/BANK_A/availability?window=1h')
        .expect(404);

      expect(res.body.message).toContain(
        'No transaction data available for bank: BANK_A',
      );
    });

    it('should parse numeric window query', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([{} as any]);
      mockAvailabilityService.calculateBankAvailability.mockResolvedValue(
        sampleAvailability,
      );

      await request(app.getHttpServer())
        .get('/banks/BANK_A/availability?window=6')
        .expect(200);

      expect(
        mockAvailabilityService.calculateBankAvailability,
      ).toHaveBeenCalledWith('BANK_A', 6);
    });

    it('should default to 1 hour window if query is invalid', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([{} as any]);
      mockAvailabilityService.calculateBankAvailability.mockResolvedValue(
        sampleAvailability,
      );

      await request(app.getHttpServer())
        .get('/banks/BANK_A/availability?window=invalid')
        .expect(200);

      expect(
        mockAvailabilityService.calculateBankAvailability,
      ).toHaveBeenCalledWith('BANK_A', 1);
    });
  });

  describe('GET /banks/availability', () => {
    it('should return all banks availability', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([{} as any]);
      mockAvailabilityService.getAllBanksAvailability.mockResolvedValue([
        sampleAvailability,
      ]);

      const res = await request(app.getHttpServer())
        .get('/banks/availability?window=1h')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].bank_code).toBe('BANK_A');
      expect(
        mockAvailabilityService.getAllBanksAvailability,
      ).toHaveBeenCalledWith(1);
    });

    it('should generate sample data if no transactions exist', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([]);
      mockTransactionsService.generateSampleTransactionsData.mockResolvedValue(
        [],
      );
      mockAvailabilityService.getAllBanksAvailability.mockResolvedValue([
        sampleAvailability,
      ]);

      await request(app.getHttpServer())
        .get('/banks/availability?window=1h')
        .expect(200);

      expect(
        mockTransactionsService.generateSampleTransactionsData,
      ).toHaveBeenCalledWith(1);
    });

    it('should parse numeric window query', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([{} as any]);
      mockAvailabilityService.getAllBanksAvailability.mockResolvedValue([
        sampleAvailability,
      ]);

      await request(app.getHttpServer())
        .get('/banks/availability?window=12')
        .expect(200);

      expect(
        mockAvailabilityService.getAllBanksAvailability,
      ).toHaveBeenCalledWith(12);
    });

    it('should default to 1 hour window if query is invalid', async () => {
      mockTransactionsService.getAllTransactions.mockResolvedValue([{} as any]);
      mockAvailabilityService.getAllBanksAvailability.mockResolvedValue([
        sampleAvailability,
      ]);

      await request(app.getHttpServer())
        .get('/banks/availability?window=invalid')
        .expect(200);

      expect(
        mockAvailabilityService.getAllBanksAvailability,
      ).toHaveBeenCalledWith(1);
    });
  });
});
