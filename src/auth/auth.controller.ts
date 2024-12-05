import { Controller, Post, Body, UseInterceptors, UploadedFile, UnauthorizedException, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { RefreshJwtAuthGuard } from '../common/guards/refresh.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: CreateUserDto, @UploadedFile() file: Express.Multer.File) {
    return this.authService.register(body, file);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return this.authService.login(user);
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { token: string }) {
    return this.authService.refreshTokens(body.token);
  }
}