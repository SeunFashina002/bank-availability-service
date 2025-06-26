import { Transaction } from '../common/interfaces/transaction.interface';
import { StorageService } from '../common/services/storage.service';
export declare class TransactionsService {
    private readonly storageService;
    private readonly SAMPLE_BANKS;
    private readonly STATUS_CODES;
    private readonly TRANSACTIONS_PER_BANK;
    constructor(storageService: StorageService);
    generateSampleTransactionsData(timeWindowHours?: number): Promise<Transaction[]>;
    private generateBankTransactions;
    getAllTransactions(): Promise<Transaction[]>;
    getTransactionsByBank(bankCode: string): Promise<Transaction[]>;
    addTransaction(transaction: Transaction): Promise<void>;
    clearTransactions(): Promise<void>;
}
