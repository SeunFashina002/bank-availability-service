"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const transaction_interface_1 = require("../common/interfaces/transaction.interface");
const storage_service_1 = require("../common/services/storage.service");
let AvailabilityService = class AvailabilityService {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async calculateBankAvailability(bankCode, timeWindowHours = 1) {
        const allTransactions = await this.storageService.getTransactionsByBank(bankCode);
        const recentTransactions = this.filterTransactionsByTimeWindow(allTransactions, timeWindowHours);
        const statusCounts = this.countTransactionStatuses(recentTransactions);
        const totalRelevant = statusCounts[transaction_interface_1.StatusCode.SUCCESS] + statusCounts[transaction_interface_1.StatusCode.UNAVAILABLE];
        const availabilityPercentage = this.calculateAvailabilityPercentage(statusCounts);
        const confidenceLevel = this.calculateConfidenceLevel(totalRelevant);
        const availability = {
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
    filterTransactionsByTimeWindow(transactions, hours) {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hours);
        return transactions.filter((transaction) => {
            const transactionTime = new Date(transaction.timestamp);
            return transactionTime >= cutoffTime;
        });
    }
    countTransactionStatuses(transactions) {
        const counts = {
            [transaction_interface_1.StatusCode.SUCCESS]: 0,
            [transaction_interface_1.StatusCode.UNAVAILABLE]: 0,
        };
        transactions.forEach((transaction) => {
            if (transaction.status_code === transaction_interface_1.StatusCode.SUCCESS ||
                transaction.status_code === transaction_interface_1.StatusCode.UNAVAILABLE) {
                counts[transaction.status_code]++;
            }
        });
        return counts;
    }
    calculateAvailabilityPercentage(statusCounts) {
        const totalRelevant = statusCounts[transaction_interface_1.StatusCode.SUCCESS] + statusCounts[transaction_interface_1.StatusCode.UNAVAILABLE];
        if (totalRelevant === 0) {
            return null;
        }
        return (statusCounts[transaction_interface_1.StatusCode.SUCCESS] / totalRelevant) * 100;
    }
    calculateConfidenceLevel(totalRelevant) {
        if (totalRelevant === 0) {
            return transaction_interface_1.ConfidenceLevel.INSUFFICIENT_DATA;
        }
        else if (totalRelevant <= 5) {
            return transaction_interface_1.ConfidenceLevel.LOW;
        }
        else if (totalRelevant <= 20) {
            return transaction_interface_1.ConfidenceLevel.MEDIUM;
        }
        else {
            return transaction_interface_1.ConfidenceLevel.HIGH;
        }
    }
    async getBankAvailability(bankCode) {
        const allAvailability = await this.storageService.loadAvailability();
        return allAvailability.find((a) => a.bank_code === bankCode) || null;
    }
    async getAllBanksAvailability(timeWindowHours = 1) {
        const allTransactions = await this.storageService.loadTransactions();
        const uniqueBankCodes = [
            ...new Set(allTransactions.map((t) => t.bank_code)),
        ];
        const availabilities = [];
        for (const bankCode of uniqueBankCodes) {
            const availability = await this.calculateBankAvailability(bankCode, timeWindowHours);
            if (availability.total_transactions_in_window > 0) {
                availabilities.push(availability);
            }
        }
        return availabilities;
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map