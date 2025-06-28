import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { StorageService } from '../common/services/storage.service';
import {
  Transaction,
  StatusCode,
} from '../common/interfaces/transaction.interface';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockStorageService: jest.Mocked<StorageService>;

  const sampleTransactions: Transaction[] = [
    {
      bank_code: 'BANK_A',
      status_code: StatusCode.SUCCESS,
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      bank_code: 'BANK_B',
      status_code: StatusCode.UNAVAILABLE,
      timestamp: '2024-01-01T11:00:00Z',
    },
  ];

  beforeEach(async () => {
    const mockStorageServiceProvider = {
      provide: StorageService,
      useValue: {
        addTransaction: jest.fn(),
        loadTransactions: jest.fn(),
        getTransactionsByBank: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionsService, mockStorageServiceProvider],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    mockStorageService = module.get(StorageService);

    jest.clearAllMocks();
  });

  describe('Service Instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('generateSampleTransactionsData', () => {
    it('should generate transactions for all sample banks', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const timeWindowHours = 1;
      const result = await service.generateSampleTransactionsData(timeWindowHours);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(100); // 4 banks × 25 transactions each

      const bankCodes = [...new Set(result.map((transaction) => transaction.bank_code))];
      expect(bankCodes).toEqual(['BANK_A', 'BANK_B', 'BANK_C', 'BANK_D']);

      expect(mockStorageService.addTransaction).toHaveBeenCalledWith(result);
    });

    it('should generate transactions with correct time window', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);
      const timeWindowHours = 6;

      const result =
        await service.generateSampleTransactionsData(timeWindowHours);

      const now = new Date();
      const sixHoursAgo = new Date(
        now.getTime() - timeWindowHours * 60 * 60 * 1000,
      );

      result.forEach((transaction) => {
        const transactionTime = new Date(transaction.timestamp);
        expect(transactionTime.getTime()).toBeGreaterThanOrEqual(
          sixHoursAgo.getTime(),
        );
        expect(transactionTime.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should generate transactions with valid status codes', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const result = await service.generateSampleTransactionsData(1);

      result.forEach((transaction) => {
        expect([StatusCode.SUCCESS, StatusCode.UNAVAILABLE]).toContain(
          transaction.status_code,
        );
      });
    });

    it('should generate 25 transactions per bank', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const timeWindowHours = 1;
      const result = await service.generateSampleTransactionsData(timeWindowHours);

      const bankACount = result.filter((transaction) => transaction.bank_code === 'BANK_A').length;
      const bankBCount = result.filter((transaction) => transaction.bank_code === 'BANK_B').length;
      const bankCCount = result.filter((transaction) => transaction.bank_code === 'BANK_C').length;
      const bankDCount = result.filter((transaction) => transaction.bank_code === 'BANK_D').length;

      expect(bankACount).toBe(25);
      expect(bankBCount).toBe(25);
      expect(bankCCount).toBe(25);
      expect(bankDCount).toBe(25);
    });

    it('should use default time window of 1 hour when not specified', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const result = await service.generateSampleTransactionsData();

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      result.forEach((transaction) => {
        const transactionTime = new Date(transaction.timestamp);
        expect(transactionTime.getTime()).toBeGreaterThanOrEqual(
          oneHourAgo.getTime(),
        );
        expect(transactionTime.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should handle storage service errors gracefully', async () => {
      const error = new Error('Storage error');
      mockStorageService.addTransaction.mockRejectedValue(error);

      const timeWindowHours = 1;
      await expect(service.generateSampleTransactionsData(timeWindowHours)).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions from storage service', async () => {
      mockStorageService.loadTransactions.mockResolvedValue(sampleTransactions);

      const result = await service.getAllTransactions();

      expect(result).toEqual(sampleTransactions);
      expect(mockStorageService.loadTransactions).toHaveBeenCalled();
    });

    it('should handle empty transactions list', async () => {
      mockStorageService.loadTransactions.mockResolvedValue([]);

      const result = await service.getAllTransactions();

      expect(result).toEqual([]);
    });

    it('should propagate storage service errors', async () => {
      const error = new Error('Storage error');
      mockStorageService.loadTransactions.mockRejectedValue(error);

      await expect(service.getAllTransactions()).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('getTransactionsByBank', () => {
    it('should return transactions for specific bank', async () => {
      const bankATransactions = sampleTransactions.filter(
        (transaction) => transaction.bank_code === 'BANK_A',
      );
      mockStorageService.getTransactionsByBank.mockResolvedValue(
        bankATransactions,
      );

      const result = await service.getTransactionsByBank('BANK_A');

      expect(result).toEqual(bankATransactions);
      expect(mockStorageService.getTransactionsByBank).toHaveBeenCalledWith(
        'BANK_A',
      );
    });

    it('should return empty array when bank has no transactions', async () => {
      mockStorageService.getTransactionsByBank.mockResolvedValue([]);

      const result = await service.getTransactionsByBank('NONEXISTENT_BANK');

      expect(result).toEqual([]);
    });

    it('should propagate storage service errors', async () => {
      const error = new Error('Storage error');
      mockStorageService.getTransactionsByBank.mockRejectedValue(error);

      await expect(service.getTransactionsByBank('BANK_A')).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('Transaction Data Validation', () => {
    it('should generate transactions with valid ISO timestamp format', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const result = await service.generateSampleTransactionsData(1);

      result.forEach((transaction) => {
        expect(transaction.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });
    });

    it('should generate transactions with valid bank codes', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const result = await service.generateSampleTransactionsData(1);

      result.forEach((transaction) => {
        expect(transaction.bank_code).toMatch(/^BANK_[A-D]$/);
      });
    });

    it('should generate transactions with all required fields', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const result = await service.generateSampleTransactionsData(1);

      result.forEach((transaction) => {
        expect(transaction).toHaveProperty('bank_code');
        expect(transaction).toHaveProperty('status_code');
        expect(transaction).toHaveProperty('timestamp');
        expect(typeof transaction.bank_code).toBe('string');
        expect(typeof transaction.status_code).toBe('string');
        expect(typeof transaction.timestamp).toBe('string');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero time window', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const timeWindowHours = 0;
      const result = await service.generateSampleTransactionsData(timeWindowHours);

      expect(result.length).toBe(100);
      result.forEach((transaction) => {
        const transactionTime = new Date(transaction.timestamp);
        const now = new Date();
        expect(transactionTime.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should handle very large time window', async () => {
      mockStorageService.addTransaction.mockResolvedValue(undefined);

      const result = await service.generateSampleTransactionsData(1000);

      expect(result.length).toBe(100);
      const now = new Date();
      const thousandHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 1000);

      result.forEach((transaction) => {
        const transactionTime = new Date(transaction.timestamp);
        expect(transactionTime.getTime()).toBeGreaterThanOrEqual(
          thousandHoursAgo.getTime(),
        );
        expect(transactionTime.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });
});
