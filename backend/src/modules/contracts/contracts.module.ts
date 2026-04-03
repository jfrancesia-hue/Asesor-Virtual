import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { PdfService } from './pdf.service';

@Module({
  controllers: [ContractsController],
  providers: [ContractsService, PdfService],
  exports: [ContractsService],
})
export class ContractsModule {}
