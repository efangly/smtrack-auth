import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';
import { PrismaService } from '../prisma/prisma.service';
import { dateFormat } from '../common/utils';
import { LoggerService } from '../common/services';
import { RedisService } from '../redis/redis.service';
import { JwtPayloadDto } from '../auth/dto/payload.dto';
import { Prisma } from '@prisma/client';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class WardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
    private readonly logger: LoggerService
  ) { }
  async create(createWardDto: CreateWardDto) {
    createWardDto.createAt = dateFormat(new Date());
    createWardDto.updateAt = dateFormat(new Date());

    const ward = await this.prisma.wards.create({
      data: createWardDto,
      include: { hospital: true }
    });

    // Clear relevant caches
    await Promise.all([
      this.redis.del("hospital"),
      this.redis.del("ward")
    ]);

    return ward;
  }

  async findAll(user: JwtPayloadDto) {
    const { conditions, key } = this.findCondition(user);

    const cache = await this.redis.get(key);
    if (cache) return JSON.parse(cache);

    const wards = await this.prisma.wards.findMany({
      where: conditions,
      include: { hospital: true },
      orderBy: { wardSeq: 'asc' }
    });

    if (wards.length > 0) await this.redis.set(key, JSON.stringify(wards), 3600 * 10);
    return wards;
  }

  async findOne(id: string) {
    const ward = await this.prisma.wards.findUnique({
      where: { id },
      include: { hospital: true }
    });

    if (!ward) {
      this.logger.warn('Ward not found', 'WardService', { wardId: id, action: 'find_ward' });
      throw new NotFoundException('Ward not found');
    }

    return ward;
  }

  async update(id: string, updateWardDto: UpdateWardDto) {
    updateWardDto.updateAt = dateFormat(new Date());
    const ward = await this.prisma.wards.update({
      where: { id },
      data: updateWardDto
    });

    // Send notifications to appropriate services
    try {
      if (ward.type === 'LEGACY') {
        await this.rabbitmq.sendToLegacy<{ id: string, name: string }>('update-ward', {
          id: ward.id,
          name: ward.wardName
        });
      } else {
        await this.rabbitmq.sendToDevice<{ id: string, name: string }>('update-ward', {
          id: ward.id,
          name: ward.wardName
        });
      }
    } catch (messageError) {
      this.logger.error('Failed to send ward update notifications', messageError, 'WardService', {
        wardId: id,
        wardName: ward.wardName,
        wardType: ward.type
      });
      // Don't throw error for messaging failure
    }

    // Clear caches
    await Promise.all([
      this.redis.del("hospital"),
      this.redis.del("ward")
    ]);

    return ward;
  }

  async remove(id: string) {
    // Check if ward exists first
    const existingWard = await this.prisma.wards.findUnique({ where: { id } });
    if (!existingWard) {
      this.logger.warn('Attempt to delete non-existent ward', 'WardService', { wardId: id });
      throw new NotFoundException('Ward not found');
    }

    await this.prisma.wards.delete({ where: { id } });

    // Clear caches
    await Promise.all([
      this.redis.del("hospital"),
      this.redis.del("ward")
    ]);

    return "Ward deleted successfully";
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
        this.logger.warn('Invalid role in ward condition check', 'WardService', {
          role: user.role,
          userId: user.id
        });
        throw new BadRequestException("Invalid role");
    }
    return { conditions, key };
  }
}
