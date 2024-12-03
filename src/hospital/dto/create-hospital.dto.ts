import { IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsNumber, IsDate } from 'class-validator';

export class CreateHospitalDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  hosName: string;

  @IsOptional()
  @IsNumber()
  hosSeq: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  hosAddress: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  hosTel: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  userContact: string;

  @IsOptional()
  @IsString()
  @MinLength(9)
  @MaxLength(20)
  userTel: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  hosLatitude: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  hosLongitude: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  hosPic: string;

  @IsDate()
  @IsOptional()
  createAt: Date;

  @IsDate()
  @IsOptional()
  updateAt: Date;
}