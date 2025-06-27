import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Transaction,
  BankAvailability,
} from '../interfaces/transaction.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly transactionsFile = 'data/transactions.json';
  private readonly availabilityFile = 'data/availability.json';

  constructor() {
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(this.transactionsFile);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await fs.writeFile(
        this.transactionsFile,
        JSON.stringify(transactions, null, 2),
      );
    } catch (error) {
      console.error('Error saving transactions:', error);
      throw new InternalServerErrorException(
        'Failed to save transactions to file',
      );
    }
  }

  async loadTransactions(): Promise<Transaction[]> {
    try {
      const data = await fs.readFile(this.transactionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // no file yet
      }
      console.error('Error loading transactions:', error);
      throw new InternalServerErrorException(
        'Failed to load transactions from file',
      );
    }
  }

  async saveAvailability(availabilityData: BankAvailability[]): Promise<void> {
    try {
      await fs.writeFile(
        this.availabilityFile,
        JSON.stringify(availabilityData, null, 2),
      );
    } catch (error) {
      console.error('Error saving availability data:', error);
      throw new InternalServerErrorException(
        'Failed to save availability data to file',
      );
    }
  }

  async loadAvailability(): Promise<BankAvailability[]> {
    try {
      const data = await fs.readFile(this.availabilityFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      console.error('Error loading availability data:', error);
      throw new InternalServerErrorException(
        'Failed to load availability data from file',
      );
    }
  }

  async addTransaction(
    transaction: Transaction | Transaction[],
  ): Promise<void> {
    const transactions = await this.loadTransactions();

    if (Array.isArray(transaction)) {
      transactions.push(...transaction);
    } else {
      transactions.push(transaction);
    }

    await this.saveTransactions(transactions);
  }

  async updateAvailability(availability: BankAvailability): Promise<void> {
    const allAvailability = await this.loadAvailability();
    const existingIndex = allAvailability.findIndex(
      (available: BankAvailability) =>
        available.bank_code === availability.bank_code,
    );

    if (existingIndex >= 0) {
      allAvailability[existingIndex] = availability;
    } else {
      allAvailability.push(availability);
    }

    await this.saveAvailability(allAvailability);
  }

  async getTransactionsByBank(bankCode: string): Promise<Transaction[]> {
    const allTransactions = await this.loadTransactions();
    return allTransactions.filter(
      (transaction: Transaction) => transaction.bank_code === bankCode,
    );
  }
}
