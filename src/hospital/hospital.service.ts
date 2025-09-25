import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { PrismaService } from '../prisma/prisma.service';
import { uploadFile, dateFormat } from '../common/utils';
import { LoggerService } from '../common/services';
import { JwtPayloadDto } from 'src/auth/dto/payload.dto';
import { Prisma } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class HospitalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
    private readonly logger: LoggerService
  ) { }
  async create(createHospitalDto: CreateHospitalDto, file?: Express.Multer.File) {
    if (file) {
      try {
        createHospitalDto.hosPic = await uploadFile(file, 'hospital');
      } catch (uploadError) {
        this.logger.error('Failed to upload hospital image', uploadError, 'HospitalService', {
          hospitalName: createHospitalDto.hosName,
          filename: file.originalname
        });
        throw new InternalServerErrorException('Image upload failed');
      }
    }

    createHospitalDto.createAt = dateFormat(new Date());
    createHospitalDto.updateAt = dateFormat(new Date());

    const hospital = await this.prisma.hospitals.create({ data: createHospitalDto });
    await this.redis.del("hospital");

    return hospital;
  }

  async findAll(user: JwtPayloadDto) {
    const { conditions, key } = this.findCondition(user);

    const cache = await this.redis.get(key);
    if (cache) {
      return JSON.parse(cache);
    }

    const hospitals = await this.prisma.hospitals.findMany({
      where: conditions,
      include: { ward: { orderBy: { wardSeq: 'asc' } } },
      orderBy: { hosSeq: 'asc' }
    });

    if (hospitals.length > 0) {
      await this.redis.set(key, JSON.stringify(hospitals), 3600 * 10);
    }

    return hospitals;
  }

  async findOne(id: string) {
    const hospital = await this.prisma.hospitals.findUnique({
      where: { id },
      include: { ward: { orderBy: { wardSeq: 'asc' } } },
    });

    if (!hospital) {
      this.logger.warn('Hospital not found', 'HospitalService', { hospitalId: id, action: 'find_hospital' });
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto, file?: Express.Multer.File) {
    if (file) {
      try {
        updateHospitalDto.hosPic = await uploadFile(file, 'hospital');
        const hospital = await this.prisma.hospitals.findUnique({ where: { id } });

        if (hospital?.hosPic) {
          try {
            const fileName = hospital.hosPic.split('/')[hospital.hosPic.split('/').length - 1];
            await axios.delete(`${process.env.UPLOAD_PATH}/api/image/hospital/${fileName}`);
          } catch (deleteError) {
            const fileName = hospital.hosPic.split('/')[hospital.hosPic.split('/').length - 1];
            this.logger.warn('Failed to delete old hospital image', 'HospitalService', {
              hospitalId: id,
              filename: fileName,
              error: deleteError.message
            });
          }
        }
      } catch (uploadError) {
        this.logger.error('Failed to upload hospital image', uploadError, 'HospitalService', {
          hospitalId: id,
          filename: file.originalname
        });
        throw new InternalServerErrorException('Image upload failed');
      }
    }

    updateHospitalDto.updateAt = dateFormat(new Date());
    const hospital = await this.prisma.hospitals.update({
      where: { id },
      data: updateHospitalDto
    });

    // Send notifications to other services
    try {
      await Promise.all([
        this.rabbitmq.sendToDevice<{ id: string, name: string }>('update-hospital', {
          id: hospital.id,
          name: hospital.hosName
        }),
        this.rabbitmq.sendToLegacy<{ id: string, name: string }>('update-hospital', {
          id: hospital.id,
          name: hospital.hosName
        })
      ]);
    } catch (messageError) {
      this.logger.error('Failed to send hospital update notifications', messageError, 'HospitalService', {
        hospitalId: id,
        hospitalName: hospital.hosName
      });
      // Don't throw error for messaging failure
    }

    await this.redis.del("hospital");
    return hospital;
  }

  async remove(id: string) {
    const existingHospital = await this.prisma.hospitals.findUnique({ where: { id } });
    if (!existingHospital) {
      this.logger.warn('Attempt to delete non-existent hospital', 'HospitalService', { hospitalId: id });
      throw new NotFoundException('Hospital not found');
    }

    const hospital = await this.prisma.hospitals.delete({ where: { id } });

    // Delete associated image if exists
    if (hospital.hosPic) {
      try {
        const fileName = hospital.hosPic.split('/')[hospital.hosPic.split('/').length - 1];
        await axios.delete(`${process.env.UPLOAD_PATH}/api/image/hospital/${fileName}`);
      } catch (imageDeleteError) {
        this.logger.error('Error deleting hospital image', imageDeleteError, 'HospitalService', {
          hospitalId: id,
          imagePath: hospital.hosPic
        });
        // Don't throw error for image deletion failure
      }
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
        this.logger.warn('Invalid role in hospital condition check', 'HospitalService', {
          role: user.role,
          userId: user.id
        });
        throw new BadRequestException("Invalid role");
    }
    return { conditions, key };
  }
}
