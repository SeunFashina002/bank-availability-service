import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { StorageService } from '../common/services/storage.service';
import { TransactionsService } from '../transactions/transactions.service';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, StorageService, TransactionsService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
