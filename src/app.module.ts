import { Module } from '@nestjs/common';
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [AvailabilityModule],
})
export class AppModule {}
