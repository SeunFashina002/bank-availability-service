import { Injectable } from '@nestjs/common';
import {
  Transaction,
  BankAvailability,
  TransactionStatus,
  StatusCode,
  ConfidenceLevel,
} from '../common/interfaces/transaction.interface';
import { StorageService } from '../common/services/storage.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly storageService: StorageService) {}

  async calculateBankAvailability(
    bankCode: string,
    timeWindowHours: number = 1,
  ): Promise<BankAvailability> {
    const allTransactions =
      await this.storageService.getTransactionsByBank(bankCode);

    const recentTransactions = this.filterTransactionsByTimeWindow(
      allTransactions,
      timeWindowHours,
    );

    const statusCounts = this.countTransactionStatuses(recentTransactions);
    const totalRelevant =
      statusCounts[StatusCode.SUCCESS] + statusCounts[StatusCode.UNAVAILABLE];

    const availabilityPercentage =
      this.calculateAvailabilityPercentage(statusCounts);

    const confidenceLevel = this.calculateConfidenceLevel(totalRelevant);

    const availability: BankAvailability = {
      bank_code: bankCode,
      availability_percentage: availabilityPercentage,
      confidence_level: confidenceLevel,
      time_window: `${timeWindowHours}h`,
      last_calculated_at: new Date().toISOString(),
      total_transactions_in_window: totalRelevant,
      status_counts: statusCounts,
    };

    await this.storageService.updateAvailability(availability);

    return availability;
  }

  private filterTransactionsByTimeWindow(
    transactions: Transaction[],
    hours: number,
  ): Transaction[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return transactions.filter((transaction) => {
      const transactionTime = new Date(transaction.timestamp);
      return transactionTime >= cutoffTime;
    });
  }

  private countTransactionStatuses(
    transactions: Transaction[],
  ): TransactionStatus {
    const counts: TransactionStatus = {
      [StatusCode.SUCCESS]: 0,
      [StatusCode.UNAVAILABLE]: 0,
    };

    transactions.forEach((transaction) => {
      if (
        transaction.status_code === StatusCode.SUCCESS ||
        transaction.status_code === StatusCode.UNAVAILABLE
      ) {
        counts[transaction.status_code]++;
      }
    });

    return counts;
  }

  private calculateAvailabilityPercentage(
    statusCounts: TransactionStatus,
  ): number | null {
    const totalRelevant =
      statusCounts[StatusCode.SUCCESS] + statusCounts[StatusCode.UNAVAILABLE];

    if (totalRelevant === 0) {
      return null; // Insufficient data
    }

    return (statusCounts[StatusCode.SUCCESS] / totalRelevant) * 100;
  }

  private calculateConfidenceLevel(totalRelevant: number): ConfidenceLevel {
    if (totalRelevant === 0) {
      return ConfidenceLevel.INSUFFICIENT_DATA;
    } else if (totalRelevant <= 5) {
      return ConfidenceLevel.LOW;
    } else if (totalRelevant <= 20) {
      return ConfidenceLevel.MEDIUM;
    } else {
      return ConfidenceLevel.HIGH;
    }
  }

  async getBankAvailability(
    bankCode: string,
  ): Promise<BankAvailability | null> {
    const allAvailability = await this.storageService.loadAvailability();
    return allAvailability.find((a) => a.bank_code === bankCode) || null;
  }

  async getAllBanksAvailability(
    timeWindowHours: number = 1,
  ): Promise<BankAvailability[]> {
    const allTransactions = await this.storageService.loadTransactions();
    const uniqueBankCodes = [
      ...new Set(allTransactions.map((t) => t.bank_code)),
    ];

    const availabilities: BankAvailability[] = [];

    for (const bankCode of uniqueBankCodes) {
      const availability = await this.calculateBankAvailability(
        bankCode,
        timeWindowHours,
      );
      if (availability.total_transactions_in_window > 0) {
        availabilities.push(availability);
      }
    }

    return availabilities;
  }
}
