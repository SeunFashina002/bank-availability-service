import { AvailabilityService } from './availability.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BankAvailability } from '../common/interfaces/transaction.interface';
export declare class AvailabilityController {
    private readonly availabilityService;
    private readonly transactionsService;
    constructor(availabilityService: AvailabilityService, transactionsService: TransactionsService);
    getBankAvailability(bankCode: string, window?: string): Promise<BankAvailability>;
    getAllBanksAvailability(window?: string): Promise<BankAvailability[]>;
    private parseTimeWindow;
}
