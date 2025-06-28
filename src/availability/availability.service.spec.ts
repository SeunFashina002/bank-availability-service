import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { StorageService } from '../common/services/storage.service';
import {
  Transaction,
  BankAvailability,
  StatusCode,
  ConfidenceLevel,
} from '../common/interfaces/transaction.interface';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let mockStorageService: jest.Mocked<StorageService>;

  const mockTransactions: Transaction[] = [
    {
      bank_code: 'BANK_A',
      status_code: StatusCode.SUCCESS,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    },
    {
      bank_code: 'BANK_A',
      status_code: StatusCode.SUCCESS,
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    },
    {
      bank_code: 'BANK_A',
      status_code: StatusCode.UNAVAILABLE,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    },
    {
      bank_code: 'BANK_A',
      status_code: StatusCode.SUCCESS,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (outside 1h window)
    },
  ];

  const mockAvailability: BankAvailability = {
    bank_code: 'BANK_A',
    availability_percentage: 66.67,
    confidence_level: ConfidenceLevel.MEDIUM,
    time_window: '1h',
    last_calculated_at: new Date().toISOString(),
    total_transactions_in_window: 3,
    status_counts: {
      [StatusCode.SUCCESS]: 2,
      [StatusCode.UNAVAILABLE]: 1,
    },
  };

  beforeEach(async () => {
    const mockStorageServiceProvider = {
      provide: StorageService,
      useValue: {
        getTransactionsByBank: jest.fn(),
        updateAvailability: jest.fn(),
        loadAvailability: jest.fn(),
        loadTransactions: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AvailabilityService, mockStorageServiceProvider],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    mockStorageService = module.get(StorageService);

    jest.clearAllMocks();
  });

  describe('Service Instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('calculateBankAvailability', () => {
    it('should calculate availability correctly for a bank with transactions', async () => {
      mockStorageService.getTransactionsByBank.mockResolvedValue(
        mockTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);

      expect(result.bank_code).toBe('BANK_A');
      expect(result.availability_percentage).toBeCloseTo(66.67, 2);
      expect(result.confidence_level).toBe(ConfidenceLevel.LOW);
      expect(result.time_window).toBe('1h');
      expect(result.total_transactions_in_window).toBe(3);
      expect(result.status_counts).toEqual({
        [StatusCode.SUCCESS]: 2,
        [StatusCode.UNAVAILABLE]: 1,
      });

      expect(mockStorageService.updateAvailability).toHaveBeenCalledWith(
        result,
      );
    });

    it('should handle bank with no transactions', async () => {
      mockStorageService.getTransactionsByBank.mockResolvedValue([]);
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('EMPTY_BANK', 1);

      expect(result.bank_code).toBe('EMPTY_BANK');
      expect(result.availability_percentage).toBeNull();
      expect(result.confidence_level).toBe(ConfidenceLevel.INSUFFICIENT_DATA);
      expect(result.total_transactions_in_window).toBe(0);
      expect(result.status_counts).toEqual({
        [StatusCode.SUCCESS]: 0,
        [StatusCode.UNAVAILABLE]: 0,
      });
    });

    it('should filter transactions by time window correctly', async () => {
      const transactionsWithOldData = [
        ...mockTransactions,
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        },
      ];

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        transactionsWithOldData,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);

      expect(result.total_transactions_in_window).toBe(3);
    });

    it('should use default time window of 1 hour when not specified', async () => {
      mockStorageService.getTransactionsByBank.mockResolvedValue(
        mockTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A');

      expect(result.time_window).toBe('1h');
    });

    it('should handle storage service errors gracefully', async () => {
      const error = new Error('Storage error');
      mockStorageService.getTransactionsByBank.mockRejectedValue(error);

      await expect(
        service.calculateBankAvailability('BANK_A', 1),
      ).rejects.toThrow('Storage error');
    });
  });

  describe('Confidence Level Calculation', () => {
    it('should return INSUFFICIENT_DATA for 0 transactions', async () => {
      mockStorageService.getTransactionsByBank.mockResolvedValue([]);
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.confidence_level).toBe(ConfidenceLevel.INSUFFICIENT_DATA);
    });

    it('should return LOW for 1-5 transactions', async () => {
      const lowVolumeTransactions = Array.from({ length: 3 }, (_, i) => ({
        bank_code: 'BANK_A',
        status_code: StatusCode.SUCCESS,
        timestamp: new Date(Date.now() - i * 10 * 60 * 1000).toISOString(),
      }));

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        lowVolumeTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.confidence_level).toBe(ConfidenceLevel.LOW);
    });

    it('should return MEDIUM for 6-20 transactions', async () => {
      const mediumVolumeTransactions = Array.from({ length: 15 }, (_, i) => ({
        bank_code: 'BANK_A',
        status_code: StatusCode.SUCCESS,
        timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
      }));

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        mediumVolumeTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.confidence_level).toBe(ConfidenceLevel.MEDIUM);
    });

    it('should return HIGH for more than 20 transactions', async () => {
      const highVolumeTransactions = Array.from({ length: 25 }, (_, i) => ({
        bank_code: 'BANK_A',
        status_code: StatusCode.SUCCESS,
        timestamp: new Date(Date.now() - i * 2 * 60 * 1000).toISOString(),
      }));

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        highVolumeTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.confidence_level).toBe(ConfidenceLevel.HIGH);
    });
  });

  describe('Availability Percentage Calculation', () => {
    it('should calculate 100% availability for all successful transactions', async () => {
      const allSuccessTransactions = Array.from({ length: 10 }, (_, i) => ({
        bank_code: 'BANK_A',
        status_code: StatusCode.SUCCESS,
        timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
      }));

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        allSuccessTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.availability_percentage).toBe(100);
    });

    it('should calculate 0% availability for all unavailable transactions', async () => {
      const allUnavailableTransactions = Array.from({ length: 10 }, (_, i) => ({
        bank_code: 'BANK_A',
        status_code: StatusCode.UNAVAILABLE,
        timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
      }));

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        allUnavailableTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.availability_percentage).toBe(0);
    });

    it('should calculate 50% availability for mixed transactions', async () => {
      const mixedTransactions = [
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.UNAVAILABLE,
          timestamp: new Date().toISOString(),
        },
      ];

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        mixedTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.availability_percentage).toBe(50);
    });

    it('should return null for no transactions', async () => {
      mockStorageService.getTransactionsByBank.mockResolvedValue([]);
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);
      expect(result.availability_percentage).toBeNull();
    });
  });

  describe('getBankAvailability', () => {
    it('should return availability data for existing bank', async () => {
      const allAvailability = [mockAvailability];
      mockStorageService.loadAvailability.mockResolvedValue(allAvailability);

      const result = await service.getBankAvailability('BANK_A');

      expect(result).toEqual(mockAvailability);
      expect(mockStorageService.loadAvailability).toHaveBeenCalled();
    });

    it('should return null for non-existing bank', async () => {
      const allAvailability = [mockAvailability];
      mockStorageService.loadAvailability.mockResolvedValue(allAvailability);

      const result = await service.getBankAvailability('NONEXISTENT_BANK');

      expect(result).toBeNull();
    });

    it('should handle empty availability data', async () => {
      mockStorageService.loadAvailability.mockResolvedValue([]);

      const result = await service.getBankAvailability('BANK_A');

      expect(result).toBeNull();
    });

    it('should propagate storage service errors', async () => {
      const error = new Error('Storage error');
      mockStorageService.loadAvailability.mockRejectedValue(error);

      await expect(service.getBankAvailability('BANK_A')).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('getAllBanksAvailability', () => {
    it('should calculate availability for all banks with transactions', async () => {
      const allTransactions = [
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
        {
          bank_code: 'BANK_B',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
        {
          bank_code: 'BANK_C',
          status_code: StatusCode.UNAVAILABLE,
          timestamp: new Date().toISOString(),
        },
      ];

      mockStorageService.loadTransactions.mockResolvedValue(allTransactions);
      mockStorageService.getTransactionsByBank
        .mockResolvedValueOnce([allTransactions[0]]) // BANK_A
        .mockResolvedValueOnce([allTransactions[1]]) // BANK_B
        .mockResolvedValueOnce([allTransactions[2]]); // BANK_C
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.getAllBanksAvailability(1);

      expect(result).toHaveLength(3);
      expect(result.map((result) => result.bank_code)).toEqual([
        'BANK_A',
        'BANK_B',
        'BANK_C',
      ]);
      expect(mockStorageService.loadTransactions).toHaveBeenCalled();
    });

    it('should exclude banks with no transactions in time window', async () => {
      const allTransactions = [
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
        {
          bank_code: 'BANK_B',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        }, // 2 hours ago
      ];

      mockStorageService.loadTransactions.mockResolvedValue(allTransactions);
      mockStorageService.getTransactionsByBank
        .mockResolvedValueOnce([allTransactions[0]])
        .mockResolvedValueOnce([]);
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.getAllBanksAvailability(1);

      expect(result).toHaveLength(1);
      expect(result[0].bank_code).toBe('BANK_A');
    });

    it('should use default time window of 1 hour when not specified', async () => {
      const allTransactions = [
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
      ];

      mockStorageService.loadTransactions.mockResolvedValue(allTransactions);
      mockStorageService.getTransactionsByBank.mockResolvedValue(
        allTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.getAllBanksAvailability();

      expect(result[0].time_window).toBe('1h');
    });

    it('should handle empty transactions list', async () => {
      mockStorageService.loadTransactions.mockResolvedValue([]);

      const result = await service.getAllBanksAvailability(1);

      expect(result).toEqual([]);
    });

    it('should handle storage service errors', async () => {
      const error = new Error('Storage error');
      mockStorageService.loadTransactions.mockRejectedValue(error);

      await expect(service.getAllBanksAvailability(1)).rejects.toThrow(
        'Storage error',
      );
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('should handle transactions with invalid status codes', async () => {
      const transactionsWithInvalidStatus = [
        {
          bank_code: 'BANK_A',
          status_code: 'INVALID_STATUS',
          timestamp: new Date().toISOString(),
        },
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
      ];

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        transactionsWithInvalidStatus as any,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 1);

      expect(result.total_transactions_in_window).toBe(1);
      expect(result.status_counts[StatusCode.SUCCESS]).toBe(1);
      expect(result.status_counts[StatusCode.UNAVAILABLE]).toBe(0);
    });

    it('should handle very large time windows', async () => {
      const oldTransactions = [
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(),
        },
      ];

      mockStorageService.getTransactionsByBank.mockResolvedValue(
        oldTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 200);

      expect(result.total_transactions_in_window).toBe(1);
      expect(result.time_window).toBe('200h');
    });

    it('should handle zero time window', async () => {
      mockStorageService.getTransactionsByBank.mockResolvedValue(
        mockTransactions,
      );
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.calculateBankAvailability('BANK_A', 0);

      expect(result.total_transactions_in_window).toBe(0);
      expect(result.time_window).toBe('0h');
    });

    it('should generate unique bank codes correctly', async () => {
      const duplicateTransactions = [
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
        {
          bank_code: 'BANK_A',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
        {
          bank_code: 'BANK_B',
          status_code: StatusCode.SUCCESS,
          timestamp: new Date().toISOString(),
        },
      ];

      mockStorageService.loadTransactions.mockResolvedValue(
        duplicateTransactions,
      );
      mockStorageService.getTransactionsByBank
        .mockResolvedValueOnce([
          duplicateTransactions[0],
          duplicateTransactions[1],
        ]) // BANK_A
        .mockResolvedValueOnce([duplicateTransactions[2]]); // BANK_B
      mockStorageService.updateAvailability.mockResolvedValue(undefined);

      const result = await service.getAllBanksAvailability(1);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.bank_code)).toEqual(['BANK_A', 'BANK_B']);
    });
  });
});
