import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, AuthModule, HealthModule ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
