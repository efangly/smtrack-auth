import { Module } from '@nestjs/common';
import { WardService } from './ward.service';
import { WardController } from './ward.controller';
import { LoggerService } from '../common/services';

@Module({
  controllers: [WardController],
  providers: [WardService, LoggerService],
})
export class WardModule {}
