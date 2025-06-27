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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const availability_service_1 = require("./availability.service");
const transactions_service_1 = require("../transactions/transactions.service");
const bank_availability_dto_1 = require("./dto/bank-availability.dto");
let AvailabilityController = class AvailabilityController {
    constructor(availabilityService, transactionsService) {
        this.availabilityService = availabilityService;
        this.transactionsService = transactionsService;
    }
    async getBankAvailability(bankCode, window) {
        const timeWindowHours = this.parseTimeWindow(window);
        const allTransactions = await this.transactionsService.getAllTransactions();
        if (allTransactions.length === 0) {
            await this.transactionsService.generateSampleTransactionsData(timeWindowHours);
        }
        const availability = await this.availabilityService.calculateBankAvailability(bankCode, timeWindowHours);
        if (availability.total_transactions_in_window === 0) {
            throw new common_1.NotFoundException(`No transaction data available for bank: ${bankCode}`);
        }
        return availability;
    }
    async getAllBanksAvailability(window) {
        const timeWindowHours = this.parseTimeWindow(window);
        const allTransactions = await this.transactionsService.getAllTransactions();
        if (allTransactions.length === 0) {
            await this.transactionsService.generateSampleTransactionsData(timeWindowHours);
        }
        return await this.availabilityService.getAllBanksAvailability(timeWindowHours);
    }
    parseTimeWindow(window) {
        if (!window)
            return 1;
        const windowMap = {
            '1h': 1,
            '6h': 6,
            '24h': 24,
        };
        if (windowMap[window]) {
            return windowMap[window];
        }
        const numericHours = parseInt(window, 10);
        if (!isNaN(numericHours) && numericHours > 0 && numericHours <= 168) {
            return numericHours;
        }
        const hourMatch = window.match(/^(\d+)h$/i);
        if (hourMatch) {
            const hours = parseInt(hourMatch[1], 10);
            if (hours > 0 && hours <= 168) {
                return hours;
            }
        }
        return 1;
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, common_1.Get)(':bank_code/availability'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get bank availability',
        description: 'Retrieves the latest calculated availability for a specific bank based on transaction data from the specified time window',
    }),
    (0, swagger_1.ApiParam)({
        name: 'bank_code',
        description: 'The bank identifier (e.g., BANK_A, BANK_B)',
        example: 'BANK_A',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'window',
        required: false,
        description: 'Time window for calculation (1h, 6h, 24h)',
        example: '1h',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Bank availability data retrieved successfully',
        type: bank_availability_dto_1.BankAvailabilityDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Bank not found or no data available',
    }),
    __param(0, (0, common_1.Param)('bank_code')),
    __param(1, (0, common_1.Query)('window')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AvailabilityController.prototype, "getBankAvailability", null);
__decorate([
    (0, common_1.Get)('availability'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all banks availability',
        description: 'Retrieves availability data for all monitored banks (Bonus feature)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'window',
        required: false,
        description: 'Time window for calculation (1h, 6h, 24h)',
        example: '1h',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'All banks availability data retrieved successfully',
        type: [bank_availability_dto_1.BankAvailabilityDto],
    }),
    __param(0, (0, common_1.Query)('window')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AvailabilityController.prototype, "getAllBanksAvailability", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('banks-availability'),
    (0, common_1.Controller)('banks'),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService,
        transactions_service_1.TransactionsService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map