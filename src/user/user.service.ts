import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { uploadFile, dateFormat } from '../common/utils';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    createUserDto.createAt = dateFormat(new Date());
    createUserDto.updateAt = dateFormat(new Date());
    return this.prisma.users.create({ data: createUserDto });
  }

  async findAll() {
    return this.prisma.users.findMany({
      select: {
        id: true,
        username: true,
        userStatus: true,
        userLevel: true,
        displayName: true,
        userPic: true,
        ward: { select: { id: true, wardName: true, hosId: true } }
      },
      orderBy: { userLevel: 'asc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        userStatus: true,
        userLevel: true,
        displayName: true,
        userPic: true,
        ward: {
          select: {
            id: true,
            wardName: true,
            hospital: { select: { id: true, hosName: true, hosPic: true } }
          },
        }
      }
    });
  }

  async findByUsername(username: string) {
    return this.prisma.users.findUnique({
      where: { username: username },
      include: { ward: true }
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, file: Express.Multer.File) {
    if (file) {
      updateUserDto.userPic = await uploadFile(file, 'users');
      const user = await this.findOne(id);
      if (user.userPic) {
        const fileName = user.userPic.split('/')[user.userPic.split('/').length - 1];
        await axios.delete(`${process.env.UPLOAD_PATH}/media/image/users/${fileName}`);
      }
    }
    updateUserDto.updateAt = dateFormat(new Date());
    return this.prisma.users.update({ where: { id }, data: updateUserDto });
  }

  async remove(id: string) {
    const user = await this.prisma.users.delete({ where: { id } });
    if (user.userPic) {
      const fileName = user.userPic.split('/')[user.userPic.split('/').length - 1];
      const response = await axios.delete(`${process.env.UPLOAD_PATH}/media/image/users/${fileName}`);
      if (!response.data) throw new BadRequestException('Failed to delete image');
    }
    return user;
  }
}
