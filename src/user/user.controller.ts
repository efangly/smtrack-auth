import { Controller, Get, Post, Body, Put, Param, Delete, NotFoundException, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtPayloadDto } from '../auth/dto/payload.dto';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.SUPER, Role.SERVICE)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async findAll(@Request() req: { user: JwtPayloadDto }) {
    return this.userService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) throw new NotFoundException("User not found");
    return this.userService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file: Express.Multer.File) {
    return this.userService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  @Roles(Role.SUPER, Role.SERVICE, Role.ADMIN, Role.LEGACY_ADMIN)
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
