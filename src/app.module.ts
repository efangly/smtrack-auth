import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { RedisOptions } from './common/constants/radis.constant';
import { UserModule } from './user/user.module';
import { HospitalModule } from './hospital/hospital.module';
import { WardModule } from './ward/ward.module';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    CacheModule.registerAsync(RedisOptions),
    PrismaModule, 
    AuthModule, 
    HealthModule, 
    UserModule, 
    HospitalModule, 
    WardModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
