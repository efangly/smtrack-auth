import { Injectable } from '@nestjs/common';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { PrismaService } from '../prisma/prisma.service';
import { uploadFile, dateFormat } from '../common/utils';
import axios from 'axios';

@Injectable()
export class HospitalService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createHospitalDto: CreateHospitalDto, file: Express.Multer.File) {
    if (file) createHospitalDto.hosPic = await uploadFile(file, 'hospitals');
    createHospitalDto.createAt = dateFormat(new Date());
    createHospitalDto.updateAt = dateFormat(new Date());
    return this.prisma.hospitals.create({ data: createHospitalDto });
  }

  async findAll() {
    return this.prisma.hospitals.findMany({ 
      include: { ward: { orderBy: { wardSeq: 'asc' } } },
      orderBy: { hosSeq: 'asc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.hospitals.findUnique({ 
      where: { id },
      include: { ward: { orderBy: { wardSeq: 'asc' } } },
    });
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto, file: Express.Multer.File) {
    if (file) {
      updateHospitalDto.hosPic = await uploadFile(file, 'hospitals');
      const hospital = await this.findOne(id);
      if (hospital.hosPic) {
        const fileName = hospital.hosPic.split('/')[hospital.hosPic.split('/').length - 1];
        await axios.delete(`${process.env.UPLOAD_PATH}/media/image/hospitals/${fileName}`);
      }
    }
    updateHospitalDto.updateAt = dateFormat(new Date());
    return this.prisma.hospitals.update({ where: { id }, data: updateHospitalDto });
  }

  async remove(id: string) {
    const hospital = await this.prisma.hospitals.delete({ where: { id } });
    if (hospital.hosPic) {
      const fileName = hospital.hosPic.split('/')[hospital.hosPic.split('/').length - 1];
      await axios.delete(`${process.env.UPLOAD_PATH}/media/image/hospitals/${fileName}`);
    }
    return hospital;
  }
}
