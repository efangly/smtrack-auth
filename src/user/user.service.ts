import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { uploadFile, dateFormat } from '../common/utils';
import { RedisService } from '../redis/redis.service';
import { LoggerService } from '../common/services';
import { Prisma } from '@prisma/client';
import { JwtPayloadDto } from 'src/auth/dto/payload.dto';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService
  ) { }

  async create(createUserDto: CreateUserDto) {
    createUserDto.createAt = dateFormat(new Date());
    createUserDto.updateAt = dateFormat(new Date());
    const user = await this.prisma.users.create({ data: createUserDto });
    await this.redis.del('user');
    return user;
  }

  async findAll(user: JwtPayloadDto) {
    const { conditions, key } = this.findCondition(user);

    const cache = await this.redis.get(key);
    if (cache) return JSON.parse(cache);
    const users = await this.prisma.users.findMany({
      where: conditions,
      select: {
        id: true,
        username: true,
        status: true,
        role: true,
        display: true,
        pic: true,
        ward: { select: { id: true, wardName: true, hosId: true } }
      },
      orderBy: { role: 'asc' }
    });
    if (users.length > 0) await this.redis.set(key, JSON.stringify(users), 3600 * 10);
    return users;
  }

  async findOne(id: string) {
    const cacheKey = `user:${id}`;
    const cache = await this.redis.get(cacheKey);
    if (cache) return JSON.parse(cache);
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        status: true,
        role: true,
        display: true,
        pic: true,
        wardId: true,
        ward: {
          select: {
            wardName: true,
            type: true,
            hosId: true,
            hospital: { select: { hosName: true, hosPic: true } }
          },
        }
      }
    });

    if (!user) {
      this.logger.warn('User not found', { userId: id, action: 'find_user' });
      throw new NotFoundException('User not found');
    }

    await this.redis.set(cacheKey, JSON.stringify(user), 3600 * 24);
    return user;

  }

  async findByUsername(username: string) {
    const cacheKey = `user:${username}`;
    const cache = await this.redis.get(cacheKey);
    if (cache) return JSON.parse(cache);
    const user = await this.prisma.users.findUnique({
      where: { username: username },
      include: { ward: true }
    });
    if (user) await this.redis.set(cacheKey, JSON.stringify(user), 3600 * 24);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
    if (file) {
      try {
        updateUserDto.pic = await uploadFile(file, 'user');
        const user = await this.findOne(id);
        // Delete old image if exists
        if (user.pic) {
          const fileName = user.pic.split('/')[user.pic.split('/').length - 1];
          try {
            await axios.delete(`${process.env.UPLOAD_PATH}/api/image/user/${fileName}`);
          } catch (deleteError) {
            this.logger.warn('Failed to delete old user image', {
              userId: id,
              filename: fileName,
              error: deleteError.message
            });
          }
        }
      } catch (uploadError) {
        this.logger.error('Failed to upload user image', uploadError, {
          userId: id,
          filename: file.originalname
        });
        throw new InternalServerErrorException('Image upload failed');
      }
    }
    updateUserDto.updateAt = dateFormat(new Date());
    const updatedUser = await this.prisma.users.update({ where: { id }, data: updateUserDto });
    await Promise.all([
      this.redis.del('user'),
      this.redis.del(`user:${id}`),
      updatedUser.username ? this.redis.del(`user:${updatedUser.username}`) : Promise.resolve()
    ]);
    return updatedUser;
  }

  async remove(id: string) {
    const existingUser = await this.prisma.users.findUnique({ where: { id } });
    if (!existingUser) {
      this.logger.warn('Attempt to delete non-existent user', { userId: id });
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.users.delete({ where: { id } });

    // Delete associated image if exists
    if (user.pic) {
      try {
        const fileName = user.pic.split('/')[user.pic.split('/').length - 1];
        const response = await axios.delete(`${process.env.UPLOAD_PATH}/api/image/user/${fileName}`);
        if (!response.data) {
          this.logger.warn('Failed to delete user image from storage', {
            userId: id,
            filename: fileName
          });
        }
      } catch (imageDeleteError) {
        this.logger.error('Error deleting user image', imageDeleteError, { userId: id, imagePath: user.pic });
      }
    }
    // Clear caches
    await Promise.all([
      this.redis.del('user'),
      this.redis.del(`user:${id}`),
      user.username ? this.redis.del(`user:${user.username}`) : Promise.resolve()
    ]);

    return user;
  }

  private findCondition(user: JwtPayloadDto): { conditions: Prisma.UsersWhereInput | undefined, key: string } {
    let conditions: Prisma.UsersWhereInput | undefined = undefined;
    let key = "";
    switch (user.role) {
      case "ADMIN":
        conditions = {
          AND: [
            { ward: { hosId: user.hosId } },
            { NOT: { ward: { hosId: "HID-DEVELOPMENT" } } }
          ]
        };
        key = `user:${user.hosId}`;
        break;
      case "LEGACY_ADMIN":
        conditions = {
          AND: [
            { ward: { hosId: user.hosId } },
            { NOT: { ward: { hosId: "HID-DEVELOPMENT" } } }
          ]
        };
        key = `user:${user.hosId}`;
        break;
      case "SERVICE":
        conditions = { NOT: { ward: { hosId: "HID-DEVELOPMENT" } } };
        key = 'user:HID-DEVELOPMENT';
        break;
      case "SUPER":
        conditions = undefined;
        key = 'user';
        break;
      default:
        this.logger.warn('Invalid role in user condition check', {
          role: user.role,
          userId: user.id
        });
        throw new BadRequestException("Invalid role");
    }
    return { conditions, key };
  }
}
