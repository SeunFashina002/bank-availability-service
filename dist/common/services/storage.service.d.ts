import { Transaction, BankAvailability } from '../interfaces/transaction.interface';
export declare class StorageService {
    private readonly transactionsFile;
    private readonly availabilityFile;
    constructor();
    private ensureDataDirectory;
    saveTransactions(transactions: Transaction[]): Promise<void>;
    loadTransactions(): Promise<Transaction[]>;
    saveAvailability(availabilityData: BankAvailability[]): Promise<void>;
    loadAvailability(): Promise<BankAvailability[]>;
    addTransaction(transaction: Transaction): Promise<void>;
    updateAvailability(availability: BankAvailability): Promise<void>;
    getTransactionsByBank(bankCode: string): Promise<Transaction[]>;
}
