import { Injectable } from '@nestjs/common';
import {
  Transaction,
  StatusCode,
} from '../common/interfaces/transaction.interface';
import { StorageService } from '../common/services/storage.service';

@Injectable()
export class TransactionsService {
  private readonly SAMPLE_BANKS = ['BANK_A', 'BANK_B', 'BANK_C', 'BANK_D'];

  private readonly STATUS_CODES = [StatusCode.SUCCESS, StatusCode.UNAVAILABLE];

  private readonly TRANSACTIONS_PER_BANK = 25;

  constructor(private readonly storageService: StorageService) {}

  async generateSampleTransactionsData(
    timeWindowHours: number = 1,
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    const now = new Date();

    for (const bankCode of this.SAMPLE_BANKS) {
      const bankTransactions = this.generateBankTransactions(
        bankCode,
        now,
        timeWindowHours,
      );
      transactions.push(...bankTransactions);
    }

    await this.storageService.saveTransactions(transactions);
    return transactions;
  }

  private generateBankTransactions(
    bankCode: string,
    baseTime: Date,
    hours: number,
  ): Transaction[] {
    const transactions: Transaction[] = [];

    for (let i = 0; i < this.TRANSACTIONS_PER_BANK; i++) {
      const statusCode =
        this.STATUS_CODES[Math.floor(Math.random() * this.STATUS_CODES.length)];

      const randomHoursAgo = Math.random() * hours;
      const timestamp = new Date(
        baseTime.getTime() - randomHoursAgo * 60 * 60 * 1000,
      );

      transactions.push({
        bank_code: bankCode,
        status_code: statusCode,
        timestamp: timestamp.toISOString(),
      });
    }

    return transactions;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await this.storageService.loadTransactions();
  }

  async getTransactionsByBank(bankCode: string): Promise<Transaction[]> {
    return await this.storageService.getTransactionsByBank(bankCode);
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    await this.storageService.addTransaction(transaction);
  }

  async clearTransactions(): Promise<void> {
    await this.storageService.saveTransactions([]);
  }
}
