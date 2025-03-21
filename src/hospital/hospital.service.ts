import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { PrismaService } from '../prisma/prisma.service';
import { uploadFile, dateFormat } from '../common/utils';
import { JwtPayloadDto } from 'src/auth/dto/payload.dto';
import { Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';

@Injectable()
export class HospitalService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) { }
  async create(createHospitalDto: CreateHospitalDto, file: Express.Multer.File) {
    if (file) createHospitalDto.hosPic = await uploadFile(file, 'hospital');
    createHospitalDto.createAt = dateFormat(new Date());
    createHospitalDto.updateAt = dateFormat(new Date());
    await this.redis.del("hospital");
    return this.prisma.hospitals.create({ data: createHospitalDto });
  }

  async findAll(user: JwtPayloadDto) {
    const { conditions, key } = this.findCondition(user);
    const cache = await this.redis.get(key);
    if (cache) return JSON.parse(cache);
    const hospital = await this.prisma.hospitals.findMany({
      where: conditions,
      include: { ward: { orderBy: { wardSeq: 'asc' } } },
      orderBy: { hosSeq: 'asc' }
    });
    if (hospital.length > 0) await this.redis.set(key, JSON.stringify(hospital), 3600 * 10);
    return hospital;
  }

  async findOne(id: string) {
    return this.prisma.hospitals.findUnique({
      where: { id },
      include: { ward: { orderBy: { wardSeq: 'asc' } } },
    });
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto, file: Express.Multer.File) {
    if (file) {
      updateHospitalDto.hosPic = await uploadFile(file, 'hospital');
      const hospital = await this.prisma.hospitals.findUnique({ where: { id } });
      if (hospital.hosPic) {
        const fileName = hospital.hosPic.split('/')[hospital.hosPic.split('/').length - 1];
        await axios.delete(`${process.env.UPLOAD_PATH}/api/image/hospitals/${fileName}`);
      }
    }
    updateHospitalDto.updateAt = dateFormat(new Date());
    await this.redis.del("hospital");
    return this.prisma.hospitals.update({ where: { id }, data: updateHospitalDto });
  }

  async remove(id: string) {
    const hospital = await this.prisma.hospitals.delete({ where: { id } });
    if (hospital.hosPic) {
      const fileName = hospital.hosPic.split('/')[hospital.hosPic.split('/').length - 1];
      await axios.delete(`${process.env.UPLOAD_PATH}/media/image/hospitals/${fileName}`);
    }
    await this.redis.del("hospital");
    return hospital;
  }

  private findCondition(user: JwtPayloadDto): { conditions: Prisma.HospitalsWhereInput | undefined, key: string } {
    let conditions: Prisma.HospitalsWhereInput | undefined = undefined;
    let key = "";
    switch (user.role) {
      case "ADMIN":
        conditions = {
          AND: [
            { id: user.hosId },
            { NOT: { id: "HID-DEVELOPMENT" } }
          ]
        };
        key = `hospital:${user.hosId}`;
        break;
      case "LEGACY_ADMIN":
        conditions = {
          AND: [
            { id: user.hosId },
            { NOT: { id: "HID-DEVELOPMENT" } }
          ]
        };
        key = `hospital:${user.hosId}`;
        break;
      case "SERVICE":
        conditions = { NOT: { id: "HID-DEVELOPMENT" } };
        key = "hospital:HID-DEVELOPMENT";
        break;
      case "SUPER":
        conditions = undefined;
        key = "hospital";
        break;
      default:
        throw new BadRequestException("Invalid role");
    }
    return { conditions, key };
  }
}
