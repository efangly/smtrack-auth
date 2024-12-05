import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { JwtPayloadDto } from '../auth/dto/payload.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('hospital')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Post()
  @Roles(Role.SUPER, Role.SERVICE)
  @UseInterceptors(FileInterceptor('image'))
  async create(@Body() createHospitalDto: CreateHospitalDto, @UploadedFile() file: Express.Multer.File) {
    return this.hospitalService.create(createHospitalDto, file);
  }

  @Get()
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async findAll(@Request() req: { user: JwtPayloadDto }) {
    return this.hospitalService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.SUPER, Role.SERVICE)
  async findOne(@Param('id') id: string) {
    const hospital = await this.hospitalService.findOne(id);
    if (!hospital) throw new NotFoundException("Hospital not found");
    return hospital;
  }

  @Put(':id')
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto, @UploadedFile() file: Express.Multer.File) {
    return this.hospitalService.update(id, updateHospitalDto, file);
  }

  @Delete(':id')
  @Roles(Role.SUPER)
  async remove(@Param('id') id: string) {
    return this.hospitalService.remove(id);
  }
}
