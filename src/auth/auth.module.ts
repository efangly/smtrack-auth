import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { LoggerService } from '../common/services';

@Module({
  imports: [
    UserModule,
    JwtModule.register({ global: true })
  ],
  providers: [AuthService, LoggerService],
  controllers: [AuthController]
})
export class AuthModule {}
