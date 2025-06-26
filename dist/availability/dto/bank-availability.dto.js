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
exports.BankAvailabilityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const transaction_interface_1 = require("../../common/interfaces/transaction.interface");
class BankAvailabilityDto {
}
exports.BankAvailabilityDto = BankAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BANK_A', description: 'The bank identifier' }),
    __metadata("design:type", String)
], BankAvailabilityDto.prototype, "bank_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 95.24,
        nullable: true,
        description: 'Availability percentage (null if insufficient data)',
    }),
    __metadata("design:type", Number)
], BankAvailabilityDto.prototype, "availability_percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: transaction_interface_1.ConfidenceLevel.HIGH,
        enum: transaction_interface_1.ConfidenceLevel,
        description: 'Confidence level of the availability calculation',
    }),
    __metadata("design:type", String)
], BankAvailabilityDto.prototype, "confidence_level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '1h',
        description: 'The time window used for calculation',
    }),
    __metadata("design:type", String)
], BankAvailabilityDto.prototype, "time_window", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2025-05-26T10:30:00Z',
        description: 'Timestamp when this data was calculated',
    }),
    __metadata("design:type", String)
], BankAvailabilityDto.prototype, "last_calculated_at", void 0);
//# sourceMappingURL=bank-availability.dto.js.map