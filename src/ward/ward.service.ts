import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';
import { PrismaService } from '../prisma/prisma.service';
import { dateFormat } from '../common/utils';
import { RedisService } from '../redis/redis.service';
import { JwtPayloadDto } from '../auth/dto/payload.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WardService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}
  async create(createWardDto: CreateWardDto) {
    createWardDto.createAt = dateFormat(new Date());
    createWardDto.updateAt = dateFormat(new Date());
    await this.redis.del("hospital");
    await this.redis.del("ward");
    return this.prisma.wards.create({ data: createWardDto, include: { hospital: true } });
  }

  async findAll(user: JwtPayloadDto) {
    const { conditions, key } = this.findCondition(user);
    const cache = await this.redis.get(key);
    if (cache) return JSON.parse(cache);
    const ward = await this.prisma.wards.findMany({ 
      where: conditions,
      include: { hospital: true } 
    });
    if (ward.length > 0) await this.redis.set(key, JSON.stringify(ward), 3600 * 10);
    return ward
  }

  async findOne(id: string) {
    return this.prisma.wards.findUnique({ where: { id }, include: { hospital: true } });
  }

  async update(id: string, updateWardDto: UpdateWardDto) {
    updateWardDto.updateAt = dateFormat(new Date());
    await this.redis.del("hospital");
    await this.redis.del("ward");
    return this.prisma.wards.update({ where: { id }, data: updateWardDto });
  }

  async remove(id: string) {
    await this.redis.del("hospital");
    await this.redis.del("ward");
    return this.prisma.wards.delete({ where: { id } });
  }

  private findCondition(user: JwtPayloadDto): { conditions: Prisma.WardsWhereInput | undefined, key: string } {
      let conditions: Prisma.WardsWhereInput | undefined = undefined;
      let key = "";
      switch (user.role) {
        case "ADMIN":
          conditions = {
            AND: [
              { hosId: user.hosId },
              { NOT: { hosId: "HID-DEVELOPMENT" } }
            ]
          };
          key = `ward:${user.hosId}`;
          break;
        case "LEGACY_ADMIN":
          conditions = {
            AND: [
              { hosId: user.hosId },
              { NOT: { hosId: "HID-DEVELOPMENT" } }
            ]
          };
          key = `ward:${user.hosId}`;
          break;
        case "SERVICE":
          conditions = { NOT: { hosId: "HID-DEVELOPMENT" } };
          key = "ward:HID-DEVELOPMENT";
          break;
        case "SUPER":
          conditions = undefined;
          key = "ward";
          break;
        default:
          throw new BadRequestException("Invalid role");
      }
      return { conditions, key };
    }
}
