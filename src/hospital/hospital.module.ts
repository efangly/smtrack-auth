import { Module } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { LoggerService } from '../common/services';

@Module({
  controllers: [HospitalController],
  providers: [HospitalService, LoggerService],
})
export class HospitalModule {}
