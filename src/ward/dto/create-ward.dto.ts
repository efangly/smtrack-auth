import { IsNotEmpty, IsString, MaxLength, IsOptional, IsNumber, IsDate } from 'class-validator';

export class CreateWardDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  wardName: string

  @IsNumber()
  @IsOptional()
  wardSeq: number

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  hosId: string 

  @IsDate()
  @IsOptional()
  createAt: Date;

  @IsDate()
  @IsOptional()
  updateAt: Date;
}
