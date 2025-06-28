import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import {
  Transaction,
  BankAvailability,
  StatusCode,
  ConfidenceLevel,
} from '../interfaces/transaction.interface';
import * as fs from 'fs/promises';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('fs/promises');

describe('StorageService', () => {
  let service: StorageService;
  let mockFs: jest.Mocked<typeof fs>;

  const sampleTransaction: Transaction = {
    bank_code: 'TEST001',
    status_code: StatusCode.SUCCESS,
    timestamp: '2024-01-01T10:00:00Z',
  };

  const sampleAvailability: BankAvailability = {
    bank_code: 'TEST001',
    availability_percentage: 85.5,
    confidence_level: ConfidenceLevel.HIGH,
    time_window: '1h',
    last_calculated_at: '2024-01-01T10:00:00Z',
    total_transactions_in_window: 100,
    status_counts: {
      [StatusCode.SUCCESS]: 85,
      [StatusCode.UNAVAILABLE]: 15,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
    mockFs = fs as jest.Mocked<typeof fs>;

    jest.clearAllMocks();
  });

  describe('Service Instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // Test 1: saveTransactions method
  describe('saveTransactions', () => {
    it('should save transactions to file successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);

      await service.saveTransactions([sampleTransaction]);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'data/transactions.json',
        JSON.stringify([sampleTransaction], null, 2),
      );
    });

    it('should throw InternalServerErrorException when file write fails', async () => {
      const error = new Error('File system error');
      mockFs.writeFile.mockRejectedValue(error);

      await expect(
        service.saveTransactions([sampleTransaction]),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // Test 2: loadTransactions method
  describe('loadTransactions', () => {
    it('should load transactions from file successfully', async () => {
      const transactionsData = JSON.stringify([sampleTransaction]);
      mockFs.readFile.mockResolvedValue(transactionsData);

      const result = await service.loadTransactions();

      expect(result).toEqual([sampleTransaction]);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        'data/transactions.json',
        'utf8',
      );
    });

    it('should return empty array when file does not exist', async () => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await service.loadTransactions();

      expect(result).toEqual([]);
    });

    it('should return empty array when file is empty', async () => {
      mockFs.readFile.mockResolvedValue('');

      const result = await service.loadTransactions();

      expect(result).toEqual([]);
    });

    it('should return empty array when file contains only whitespace', async () => {
      mockFs.readFile.mockResolvedValue('   \n\t  ');

      const result = await service.loadTransactions();

      expect(result).toEqual([]);
    });

    it('should throw InternalServerErrorException when file read fails for other reasons', async () => {
      const error = new Error('Permission denied');
      (error as any).code = 'EACCES';
      mockFs.readFile.mockRejectedValue(error);

      await expect(service.loadTransactions()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // Test 3: saveAvailability method
  describe('saveAvailability', () => {
    it('should save availability data to file successfully', async () => {
      mockFs.writeFile.mockResolvedValue(undefined);

      await service.saveAvailability([sampleAvailability]);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'data/availability.json',
        JSON.stringify([sampleAvailability], null, 2),
      );
    });

    it('should throw InternalServerErrorException when file write fails', async () => {
      const error = new Error('File system error');
      mockFs.writeFile.mockRejectedValue(error);

      await expect(
        service.saveAvailability([sampleAvailability]),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // Test 4: loadAvailability method
  describe('loadAvailability', () => {
    it('should load availability data from file successfully', async () => {
      const availabilityData = JSON.stringify([sampleAvailability]);
      mockFs.readFile.mockResolvedValue(availabilityData);

      const result = await service.loadAvailability();

      expect(result).toEqual([sampleAvailability]);
      expect(mockFs.readFile).toHaveBeenCalledWith(
        'data/availability.json',
        'utf8',
      );
    });

    it('should return empty array when file does not exist', async () => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);

      const result = await service.loadAvailability();

      expect(result).toEqual([]);
    });

    it('should return empty array when file is empty', async () => {
      mockFs.readFile.mockResolvedValue('');

      const result = await service.loadAvailability();

      expect(result).toEqual([]);
    });

    it('should return empty array when file contains only whitespace', async () => {
      mockFs.readFile.mockResolvedValue('   \n\t  ');

      const result = await service.loadAvailability();

      expect(result).toEqual([]);
    });
  });

  // Test 5: addTransaction method
  describe('addTransaction', () => {
    it('should add a single transaction to existing transactions', async () => {
      const existingTransactions = [sampleTransaction];
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingTransactions));
      mockFs.writeFile.mockResolvedValue(undefined);

      const newTransaction: Transaction = {
        bank_code: 'TEST002',
        status_code: StatusCode.UNAVAILABLE,
        timestamp: '2024-01-01T11:00:00Z',
      };

      await service.addTransaction(newTransaction);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'data/transactions.json',
        JSON.stringify([...existingTransactions, newTransaction], null, 2),
      );
    });

    it('should add multiple transactions to existing transactions', async () => {
      const existingTransactions = [sampleTransaction];
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingTransactions));
      mockFs.writeFile.mockResolvedValue(undefined);

      const newTransactions: Transaction[] = [
        {
          bank_code: 'TEST002',
          status_code: StatusCode.SUCCESS,
          timestamp: '2024-01-01T11:00:00Z',
        },
        {
          bank_code: 'TEST003',
          status_code: StatusCode.UNAVAILABLE,
          timestamp: '2024-01-01T12:00:00Z',
        },
      ];

      await service.addTransaction(newTransactions);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'data/transactions.json',
        JSON.stringify([...existingTransactions, ...newTransactions], null, 2),
      );
    });
  });

  // Test 6: updateAvailability method
  describe('updateAvailability', () => {
    it('should update existing availability data', async () => {
      const existingAvailability = [sampleAvailability];
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingAvailability));
      mockFs.writeFile.mockResolvedValue(undefined);

      const updatedAvailability: BankAvailability = {
        ...sampleAvailability,
        availability_percentage: 90.0,
        confidence_level: ConfidenceLevel.HIGH,
      };

      await service.updateAvailability(updatedAvailability);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'data/availability.json',
        JSON.stringify([updatedAvailability], null, 2),
      );
    });

    it('should add new availability data when bank does not exist', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify([]));
      mockFs.writeFile.mockResolvedValue(undefined);

      await service.updateAvailability(sampleAvailability);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'data/availability.json',
        JSON.stringify([sampleAvailability], null, 2),
      );
    });
  });

  // Test 7: getTransactionsByBank method
  describe('getTransactionsByBank', () => {
    it('should return transactions for a specific bank', async () => {
      const allTransactions = [
        { ...sampleTransaction, bank_code: 'TEST001' },
        {
          ...sampleTransaction,
          bank_code: 'TEST002',
          timestamp: '2024-01-01T11:00:00Z',
        },
        {
          ...sampleTransaction,
          bank_code: 'TEST001',
          timestamp: '2024-01-01T12:00:00Z',
        },
      ];
      mockFs.readFile.mockResolvedValue(JSON.stringify(allTransactions));

      const result = await service.getTransactionsByBank('TEST001');

      expect(result).toHaveLength(2);
      expect(
        result.every((transaction) => transaction.bank_code === 'TEST001'),
      ).toBe(true);
    });

    it('should return empty array when bank has no transactions', async () => {
      const allTransactions = [{ ...sampleTransaction, bank_code: 'TEST002' }];
      mockFs.readFile.mockResolvedValue(JSON.stringify(allTransactions));

      const result = await service.getTransactionsByBank('TEST001');

      expect(result).toEqual([]);
    });
  });
});
