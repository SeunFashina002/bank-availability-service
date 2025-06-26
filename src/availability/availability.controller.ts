import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BankAvailability } from '../common/interfaces/transaction.interface';
import { BankAvailabilityDto } from './dto/bank-availability.dto';

@ApiTags('banks')
@Controller('banks')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Get(':bank_code/availability')
  @ApiOperation({
    summary: 'Get bank availability',
    description:
      'Retrieves the latest calculated availability for a specific bank based on transaction data from the specified time window',
  })
  @ApiParam({
    name: 'bank_code',
    description: 'The bank identifier (e.g., BANK_A, BANK_B)',
    example: 'BANK_A',
  })
  @ApiQuery({
    name: 'window',
    required: false,
    description: 'Time window for calculation (1h, 6h, 24h)',
    example: '1h',
  })
  @ApiResponse({
    status: 200,
    description: 'Bank availability data retrieved successfully',
    type: BankAvailabilityDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Bank not found or no data available',
  })
  async getBankAvailability(
    @Param('bank_code') bankCode: string,
    @Query('window') window?: string,
  ): Promise<BankAvailability> {
    const timeWindowHours = this.parseTimeWindow(window);

    const allTransactions = await this.transactionsService.getAllTransactions();
    if (allTransactions.length === 0) {
      await this.transactionsService.generateSampleTransactionsData(
        timeWindowHours,
      );
    }

    const availability =
      await this.availabilityService.calculateBankAvailability(
        bankCode,
        timeWindowHours,
      );

    if (availability.total_transactions_in_window === 0) {
      throw new NotFoundException(
        `No transaction data available for bank: ${bankCode}`,
      );
    }

    return availability;
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Get all banks availability',
    description:
      'Retrieves availability data for all monitored banks (Bonus feature)',
  })
  @ApiQuery({
    name: 'window',
    required: false,
    description: 'Time window for calculation (1h, 6h, 24h)',
    example: '1h',
  })
  @ApiResponse({
    status: 200,
    description: 'All banks availability data retrieved successfully',
    type: [BankAvailabilityDto],
  })
  async getAllBanksAvailability(
    @Query('window') window?: string,
  ): Promise<BankAvailability[]> {
    const timeWindowHours = this.parseTimeWindow(window);

    const allTransactions = await this.transactionsService.getAllTransactions();
    if (allTransactions.length === 0) {
      await this.transactionsService.generateSampleTransactionsData(
        timeWindowHours,
      );
    }

    return await this.availabilityService.getAllBanksAvailability(
      timeWindowHours,
    );
  }

  private parseTimeWindow(window?: string): number {
    if (!window) return 1;

    const windowMap: { [key: string]: number } = {
      '1h': 1,
      '6h': 6,
      '24h': 24,
    };

    return windowMap[window] || 1; // Default to 1 hour if invalid
  }
}
