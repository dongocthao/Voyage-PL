import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpsertCargoMasterDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsString()
  @MaxLength(150)
  cargoName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  cargoGroup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  cargoClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  imoName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ibcCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  imsbcCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  billBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  defaultUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stowageFactor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stowageFactorFt3?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  stowageFactorUnit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hazardClass?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  productCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  capacityBasis?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  preclearanceUsCanada?: boolean;

  @IsOptional()
  @IsBoolean()
  isDangerous?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  specialHandlingRequired?: boolean;
}
