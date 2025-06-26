import { ConfidenceLevel } from '../../common/interfaces/transaction.interface';
export declare class BankAvailabilityDto {
    bank_code: string;
    availability_percentage: number | null;
    confidence_level: ConfidenceLevel;
    time_window: string;
    last_calculated_at: string;
}
