import { BankAvailability } from '../common/interfaces/transaction.interface';
import { StorageService } from '../common/services/storage.service';
export declare class AvailabilityService {
    private readonly storageService;
    constructor(storageService: StorageService);
    calculateBankAvailability(bankCode: string, timeWindowHours?: number): Promise<BankAvailability>;
    private filterTransactionsByTimeWindow;
    private countTransactionStatuses;
    private calculateAvailabilityPercentage;
    private calculateConfidenceLevel;
    getBankAvailability(bankCode: string): Promise<BankAvailability | null>;
    getAllBanksAvailability(timeWindowHours?: number): Promise<BankAvailability[]>;
}
