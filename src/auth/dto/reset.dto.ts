import { IsString, MaxLength, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  oldPassword: string;
}