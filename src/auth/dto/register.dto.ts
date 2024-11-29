import { IsNotEmpty, IsString, IsBoolean, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  wardId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsBoolean()
  userStatus: boolean;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be USER or ADMIN' })
  userLevel: Role;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  userPic: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  createBy: string;
}
