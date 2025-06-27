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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const transaction_interface_1 = require("../common/interfaces/transaction.interface");
const storage_service_1 = require("../common/services/storage.service");
let TransactionsService = class TransactionsService {
    constructor(storageService) {
        this.storageService = storageService;
        this.SAMPLE_BANKS = ['BANK_A', 'BANK_B', 'BANK_C', 'BANK_D'];
        this.STATUS_CODES = [transaction_interface_1.StatusCode.SUCCESS, transaction_interface_1.StatusCode.UNAVAILABLE];
        this.TRANSACTIONS_PER_BANK = 25;
    }
    async generateSampleTransactionsData(timeWindowHours = 1) {
        const transactions = [];
        const now = new Date();
        for (const bankCode of this.SAMPLE_BANKS) {
            const bankTransactions = this.generateBankTransactions(bankCode, now, timeWindowHours);
            transactions.push(...bankTransactions);
        }
        await this.storageService.addTransaction(transactions);
        return transactions;
    }
    generateBankTransactions(bankCode, baseTime, hours) {
        const transactions = [];
        for (let i = 0; i < this.TRANSACTIONS_PER_BANK; i++) {
            const statusCode = this.STATUS_CODES[Math.floor(Math.random() * this.STATUS_CODES.length)];
            const randomHoursAgo = Math.random() * hours;
            const timestamp = new Date(baseTime.getTime() - randomHoursAgo * 60 * 60 * 1000);
            transactions.push({
                bank_code: bankCode,
                status_code: statusCode,
                timestamp: timestamp.toISOString(),
            });
        }
        return transactions;
    }
    async getAllTransactions() {
        return await this.storageService.loadTransactions();
    }
    async getTransactionsByBank(bankCode) {
        return await this.storageService.getTransactionsByBank(bankCode);
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map