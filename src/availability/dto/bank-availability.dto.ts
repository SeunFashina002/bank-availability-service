import { ApiProperty } from '@nestjs/swagger';
import { ConfidenceLevel } from '../../common/interfaces/transaction.interface';

export class BankAvailabilityDto {
  @ApiProperty({ example: 'BANK_A', description: 'The bank identifier' })
  bank_code: string;

  @ApiProperty({
    example: 95.24,
    nullable: true,
    description: 'Availability percentage (null if insufficient data)',
  })
  availability_percentage: number | null;

  @ApiProperty({
    example: ConfidenceLevel.HIGH,
    enum: ConfidenceLevel,
    description: 'Confidence level of the availability calculation',
  })
  confidence_level: ConfidenceLevel;

  @ApiProperty({
    example: '1h',
    description: 'The time window used for calculation',
  })
  time_window: string;

  @ApiProperty({
    example: '2025-05-26T10:30:00Z',
    description: 'Timestamp when this data was calculated',
  })
  last_calculated_at: string;
}
