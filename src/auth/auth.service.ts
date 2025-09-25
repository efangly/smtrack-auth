import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Users } from '@prisma/client';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { JwtPayloadDto } from './dto/payload.dto';
import { ResetPasswordDto } from './dto/reset.dto';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../common/services';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService
  ) { }

  async register(data: CreateUserDto, file?: Express.Multer.File) {
    const existingUser = await this.userService.findByUsername(data.username.toLowerCase());
    if (existingUser) {
      this.logger.warn('Registration attempt with existing username', 'AuthService', {
        username: data.username,
        action: 'register'
      });
      throw new BadRequestException('Username already exists');
    }

    if (file) {
      try {
        const formData = new FormData();
        const uint8Array = new Uint8Array(file.buffer);
        const blob = new Blob([uint8Array], { type: file.mimetype });
        formData.append('file', blob, file.originalname);

        const response = await axios.post(`${process.env.UPLOAD_PATH}/api/image/user`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!response.data || !response.data.path) {
          this.logger.error('Failed to upload user image', null, 'AuthService', {
            username: data.username,
            filename: file.originalname
          });
          throw new BadRequestException('Failed to upload image');
        }
        data.pic = `${process.env.UPLOAD_PATH}/${response.data.path}`;
      } catch (uploadError) {
        this.logger.error('Image upload service error', uploadError, 'AuthService', {
          username: data.username,
          filename: file?.originalname
        });
        throw new InternalServerErrorException('Image upload failed');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;

    return await this.userService.create(data);
  }

  async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }

    this.logger.warn('Invalid login attempt', 'AuthService', {
      username,
      action: 'login'
    });
    return null;
  }

  async login(user: Users | any) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      this.logger.error('JWT secrets not configured', null, 'AuthService', {
        action: 'login'
      });
      throw new InternalServerErrorException('Authentication configuration error');
    }

    const payload = {
      id: user.id,
      name: user.display,
      role: user.role,
      hosId: user.ward?.hosId,
      wardId: user.wardId
    };

    return {
      token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: String(process.env.EXPIRE_TIME || '1h')
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: String(process.env.REFRESH_EXPIRE_TIME || '7d')
      }),
      id: user.id,
      name: user.display,
      hosId: user.ward?.hosId,
      wardId: user.wardId,
      role: user.role,
      pic: user.pic,
    };
  }

  refreshTokens(token: string) {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      this.logger.error('JWT secrets not configured', null, 'AuthService', {
        action: 'refresh_tokens'
      });
      throw new InternalServerErrorException('Authentication configuration error');
    }

    const decode = this.jwtService.verify<JwtPayloadDto>(token, {
      secret: process.env.JWT_REFRESH_SECRET
    });

    const payload = {
      id: decode.id,
      name: decode.name,
      role: decode.role,
      hosId: decode.hosId,
      wardId: decode.wardId
    };

    return {
      token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: String(process.env.EXPIRE_TIME || '1h')
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: String(process.env.REFRESH_EXPIRE_TIME || '7d')
      }),
    };
  }

  async resetPassword(username: string, body: ResetPasswordDto, user: JwtPayloadDto) {
    const result = await this.userService.findByUsername(username);
    if (!result) {
      this.logger.warn('Password reset attempt for non-existent user', 'AuthService', {
        username,
        requestedBy: user.id,
        action: 'reset_password'
      });
      throw new BadRequestException('User not found');
    }

    if (user.role !== "SUPER") {
      if (!body.oldPassword) {
        this.logger.warn('Password reset attempt without old password', 'AuthService', {
          username,
          requestedBy: user.id,
          action: 'reset_password'
        });
        throw new BadRequestException('Old password is required');
      }

      const match = await bcrypt.compare(body.oldPassword, result.password);
      if (!match) {
        this.logger.warn('Password reset attempt with incorrect old password', 'AuthService', {
          username,
          requestedBy: user.id,
          action: 'reset_password'
        });
        throw new BadRequestException('Old password is incorrect');
      }
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    await this.userService.update(result.id, { password: hashedPassword });

    // Clear cache
    await Promise.all([
      this.redis.del(`user:${username}`),
      this.redis.del(`user:${result.id}`)
    ]);

    return 'Password reset successfully';
  }
}
