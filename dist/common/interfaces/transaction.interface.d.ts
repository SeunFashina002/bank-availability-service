export declare enum StatusCode {
    SUCCESS = "00",
    UNAVAILABLE = "91"
}
export declare enum ConfidenceLevel {
    INSUFFICIENT_DATA = "Insufficient Data",
    LOW = "Low",
    MEDIUM = "Medium",
    HIGH = "High"
}
export interface Transaction {
    bank_code: string;
    status_code: StatusCode;
    timestamp: string;
}
export interface TransactionStatus {
    [StatusCode.SUCCESS]: number;
    [StatusCode.UNAVAILABLE]: number;
}
export interface BankAvailability {
    bank_code: string;
    availability_percentage: number | null;
    confidence_level: ConfidenceLevel;
    time_window: string;
    last_calculated_at: string;
    total_transactions_in_window: number;
    status_counts: TransactionStatus;
}
