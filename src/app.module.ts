import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { HospitalModule } from './hospital/hospital.module';
import { WardModule } from './ward/ward.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy, RefreshJwtStrategy } from './common/strategies';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { LoggerService } from './common/services';

@Module({
  imports: [
    ConfigModule.forRoot(), 
    PassportModule,
    PrismaModule, 
    AuthModule, 
    HealthModule, 
    UserModule, 
    HospitalModule, 
    WardModule, 
    RedisModule, 
    RabbitmqModule
  ],
  providers: [JwtStrategy, RefreshJwtStrategy, LoggerService],
})
export class AppModule {}
