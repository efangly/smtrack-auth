import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { uploadFile, dateFormat } from '../common/utils';
import { RedisService } from '../redis/redis.service';
import { Prisma } from '@prisma/client';
import { JwtPayloadDto } from 'src/auth/dto/payload.dto';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}
  async create(createUserDto: CreateUserDto) {
    createUserDto.createAt = dateFormat(new Date());
    createUserDto.updateAt = dateFormat(new Date());
    await this.redis.del('user');
    return this.prisma.users.create({ data: createUserDto });
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
    await this.redis.set(key, JSON.stringify(users), 3600 * 10);
    return users
  }

  async findOne(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        status: true,
        role: true,
        display: true,
        pic: true,
        ward: {
          select: {
            id: true,
            wardName: true,
            hospital: { select: { id: true, hosName: true, hosPic: true } }
          },
        }
      }
    });
  }

  async findByUsername(username: string) {
    return this.prisma.users.findUnique({
      where: { username: username },
      include: { ward: true }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
    if (file) {
      updateUserDto.pic = await uploadFile(file, 'users');
      const user = await this.findOne(id);
      if (user.pic) {
        const fileName = user.pic.split('/')[user.pic.split('/').length - 1];
        await axios.delete(`${process.env.UPLOAD_PATH}/media/image/users/${fileName}`);
      }
    }
    updateUserDto.updateAt = dateFormat(new Date());
    await this.redis.del('user');
    return this.prisma.users.update({ where: { id }, data: updateUserDto });
  }

  async remove(id: string) {
    const user = await this.prisma.users.delete({ where: { id } });
    await this.redis.del('user');
    if (user.pic) {
      const fileName = user.pic.split('/')[user.pic.split('/').length - 1];
      const response = await axios.delete(`${process.env.UPLOAD_PATH}/media/image/users/${fileName}`);
      if (!response.data) throw new BadRequestException('Failed to delete image');
    }
    return user;
  }

  private findCondition (user: JwtPayloadDto): { conditions: Prisma.UsersWhereInput | undefined, key: string } {
    let conditions: Prisma.UsersWhereInput | undefined = undefined;
    let key = "";
    switch (user.role) {
      case "ADMIN":
        conditions = { ward: { hosId: user.hosId } };
        key = `user:${user.hosId}`;
        break;
      case "LEGACY_ADMIN":
        conditions = { ward: { hosId: user.hosId } };
        key = `user:${user.hosId}`;
        break;
      case "SERVICE":
        conditions = { NOT: { ward: { hosId: "HID-DEVELOPMENT" } } };
        key = "user:HID-DEVELOPMENT";
        break;
      default:
        conditions = undefined;
        key = "user";
    }
    return { conditions, key };
  }
}
