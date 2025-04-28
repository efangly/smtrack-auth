import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException, UseInterceptors, UploadedFile, UseGuards, Request, Logger } from '@nestjs/common';
import { EventPattern, Ctx, Payload, RmqContext } from '@nestjs/microservices';
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
  private readonly logger = new Logger(HospitalController.name);

  @EventPattern('add-hospital')
    async addUser(@Payload() createHospitalDto: CreateHospitalDto, @Ctx() context: RmqContext) {
      const channel = context.getChannelRef();
      const message = context.getMessage();
      try {
        await this.hospitalService.create(createHospitalDto);
        channel.ack(message);
      } catch (error) {
        this.logger.error(error);
        channel.nack(message, false, false);
      }
    }
  
    @EventPattern('update-hospital')
    async updateUser(@Payload() updateHospitalDto: UpdateHospitalDto, @Ctx() context: RmqContext) {
      const channel = context.getChannelRef();
      const message = context.getMessage();
      try {
        await this.hospitalService.update(updateHospitalDto.id, updateHospitalDto);
        channel.ack(message);
      } catch (error) {
        this.logger.error(error);
        channel.nack(message, false, false);
      }
    }
  
    @EventPattern('delete-hospital')
    async deleteUser(@Payload() id: string, @Ctx() context: RmqContext) {
      const channel = context.getChannelRef();
      const message = context.getMessage();
      try {
        await this.hospitalService.remove(id);
        channel.ack(message);
      } catch (error) {
        this.logger.error(error);
        channel.nack(message, false, false);
      }
    }

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
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async findOne(@Param('id') id: string) {
    const hospital = await this.hospitalService.findOne(id);
    if (!hospital) throw new NotFoundException("Hospital not found");
    return hospital;
  }

  @Put(':id')
  @Roles(Role.SUPER, Role.SERVICE)
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
