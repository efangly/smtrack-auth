import { IsNotEmpty, IsString, IsBoolean, MinLength, MaxLength, IsOptional, IsEnum, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';

export class CreateUserDto {
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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  })
  @IsBoolean()
  status: boolean;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be USER or ADMIN' })
  role: Role;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  display: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pic: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  createBy: string;
  
  @IsDate()
  @IsOptional()
  createAt: Date;

  @IsDate()
  @IsOptional()
  updateAt: Date;
}
