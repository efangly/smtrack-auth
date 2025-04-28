import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException, UseGuards, Request, Logger } from '@nestjs/common';
import { EventPattern, Ctx, Payload, RmqContext } from '@nestjs/microservices';
import { WardService } from './ward.service';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtPayloadDto } from '../auth/dto/payload.dto';

@Controller('ward')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WardController {
  constructor(private readonly wardService: WardService) {}
  private readonly logger = new Logger(WardController.name);

  @EventPattern('add-ward')
  async addUser(@Payload() createWardDto: CreateWardDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.wardService.create(createWardDto);
      channel.ack(message);
    } catch (error) {
      this.logger.error(error);
      channel.nack(message, false, false);
    }
  }

  @EventPattern('update-ward')
  async updateUser(@Payload() updateWardDto: UpdateWardDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.wardService.update(updateWardDto.id, updateWardDto);
      channel.ack(message);
    } catch (error) {
      this.logger.error(error);
      channel.nack(message, false, false);
    }
  }

  @EventPattern('delete-ward')
  async deleteUser(@Payload() id: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.wardService.remove(id);
      channel.ack(message);
    } catch (error) {
      this.logger.error(error);
      channel.nack(message, false, false);
    }
  }

  @Post()
  @Roles(Role.SUPER, Role.SERVICE)
  async create(@Body() createWardDto: CreateWardDto) {
    return this.wardService.create(createWardDto);
  }

  @Get()
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async findAll(@Request() req: { user: JwtPayloadDto }) {
    return this.wardService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async findOne(@Param('id') id: string) {
    const ward = await this.wardService.findOne(id);
    if (!ward) throw new NotFoundException("Ward not found");
    return ward;
  }

  @Put(':id')
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async update(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto) {
    return this.wardService.update(id, updateWardDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async remove(@Param('id') id: string) {
    return this.wardService.remove(id);
  }
}
