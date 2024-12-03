import { IsString, MaxLength } from 'class-validator';

export class PayloadDto {
  @IsString()
  @MaxLength(150)
  userId: string;

  @IsString()
  @MaxLength(150)
  role: string;

  @IsString()
  @MaxLength(150)
  hosId: number;

  @IsString()
  @MaxLength(150)
  wardId: string;
}