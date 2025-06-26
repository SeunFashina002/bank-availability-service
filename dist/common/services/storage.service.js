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
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
let StorageService = class StorageService {
    constructor() {
        this.transactionsFile = 'data/transactions.json';
        this.availabilityFile = 'data/availability.json';
        this.ensureDataDirectory();
    }
    async ensureDataDirectory() {
        const dataDir = path.dirname(this.transactionsFile);
        try {
            await fs.access(dataDir);
        }
        catch {
            await fs.mkdir(dataDir, { recursive: true });
        }
    }
    async saveTransactions(transactions) {
        try {
            await fs.writeFile(this.transactionsFile, JSON.stringify(transactions, null, 2));
        }
        catch (error) {
            console.error('Error saving transactions:', error);
            throw new common_1.InternalServerErrorException('Failed to save transactions to file');
        }
    }
    async loadTransactions() {
        try {
            const data = await fs.readFile(this.transactionsFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            console.error('Error loading transactions:', error);
            throw new common_1.InternalServerErrorException('Failed to load transactions from file');
        }
    }
    async saveAvailability(availabilityData) {
        try {
            await fs.writeFile(this.availabilityFile, JSON.stringify(availabilityData, null, 2));
        }
        catch (error) {
            console.error('Error saving availability data:', error);
            throw new common_1.InternalServerErrorException('Failed to save availability data to file');
        }
    }
    async loadAvailability() {
        try {
            const data = await fs.readFile(this.availabilityFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            console.error('Error loading availability data:', error);
            throw new common_1.InternalServerErrorException('Failed to load availability data from file');
        }
    }
    async addTransaction(transaction) {
        const transactions = await this.loadTransactions();
        transactions.push(transaction);
        await this.saveTransactions(transactions);
    }
    async updateAvailability(availability) {
        const allAvailability = await this.loadAvailability();
        const existingIndex = allAvailability.findIndex((available) => available.bank_code === availability.bank_code);
        if (existingIndex >= 0) {
            allAvailability[existingIndex] = availability;
        }
        else {
            allAvailability.push(availability);
        }
        await this.saveAvailability(allAvailability);
    }
    async getTransactionsByBank(bankCode) {
        const allTransactions = await this.loadTransactions();
        return allTransactions.filter((transaction) => transaction.bank_code === bankCode);
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map