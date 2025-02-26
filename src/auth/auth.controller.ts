import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpCode, HttpStatus, UseGuards, BadRequestException, Patch, Request, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { RefreshJwtAuthGuard } from '../common/guards/refresh.guard';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset.dto';
import { JwtPayloadDto } from './dto/payload.dto';

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
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new BadRequestException('Invalid username or password');
    }
    return this.authService.login(user);
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { token: string }) {
    return this.authService.refreshTokens(body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reset/:id')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Param('id') id: string, @Body() body: ResetPasswordDto, @Request() req: { user: JwtPayloadDto }) {
    return this.authService.resetPassword(id, body, req.user);
  }
}