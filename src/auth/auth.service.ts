import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Users } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService) { }

  async register(data: RegisterDto, file: Express.Multer.File): Promise<Users> {
    const existingUser = await this.prisma.users.findUnique({ where: { username: data.username } });
    if (existingUser) throw new BadRequestException('Username already exists');
    if (file) {
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append('path', 'users');
      formData.append('file', blob, file.originalname);
      const response = await axios.post(`${process.env.UPLOAD_PATH}/api/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (!response.data || !response.data.filePath) {
        throw new BadRequestException('Failed to upload image');
      }
      data.userPic = `${process.env.UPLOAD_PATH}/${response.data.filePath}`;
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    data.password = hashedPassword;
    const user = await this.prisma.users.create({ data: data });
    return user;
  }

  async validateUser(username: string, password: string): Promise<Users> {
    const user = await this.prisma.users.findUnique({ 
      where: { username },
      include: { ward: true }
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result as unknown as Users;
    }
    return null;
  }

  async login(user: Users | any) {
    const payload = { userId: user.id, role: user.userLevel, hosId: user.ward.hosId, wardId: user.wardId };
    return {
      token: this.jwtService.sign(payload),
      userId: user.id,
      hosId: user.ward.hosId,
      wardId: user.wardId,
      userLevel: user.userLevel
    };
  }
}
