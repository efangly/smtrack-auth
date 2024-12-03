import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';

@Controller('hospital')
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(@Body() createHospitalDto: CreateHospitalDto, @UploadedFile() file: Express.Multer.File) {
    return this.hospitalService.create(createHospitalDto, file);
  }

  @Get()
  async findAll() {
    return this.hospitalService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const hospital = await this.hospitalService.findOne(id);
    if (!hospital) throw new NotFoundException("Hospital not found");
    return hospital;
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto, @UploadedFile() file: Express.Multer.File) {
    return this.hospitalService.update(id, updateHospitalDto, file);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.hospitalService.remove(id);
  }
}
