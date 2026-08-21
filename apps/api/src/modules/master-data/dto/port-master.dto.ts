import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertPortMasterDto {
  @IsString()
  @MaxLength(150)
  portName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  portType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  countryName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  portOperator?: string;

  @IsOptional()
  @IsInt()
  portNo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timeZoneCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  unlocode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  latitudeText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  longitudeText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  regionCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  loadlineZone?: string;

  @IsOptional()
  @IsNumber()
  stdGmtOffset?: number;

  @IsOptional()
  @IsNumber()
  dstGmtOffset?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
