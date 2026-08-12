import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CargoReletHeaderDto {
  @IsOptional()
  @IsString()
  estimateId?: string;

  @IsOptional()
  @IsString()
  estimateFileId?: string;

  @IsString()
  @MaxLength(150)
  fileName!: string;

  @IsString()
  @MaxLength(100)
  sheetName!: string;

  @IsIn(['RELT'])
  estimateTypeCode!: 'RELT';

  @IsOptional()
  @IsString()
  vesselId?: string;

  @IsOptional()
  @IsString()
  bunkerProfileId?: string;

  @IsOptional()
  @IsIn(['FULL', 'ECO', 'CUSTOM1', 'CUSTOM2', 'CUSTOM3'])
  performanceMode?: 'FULL' | 'ECO' | 'CUSTOM1' | 'CUSTOM2' | 'CUSTOM3';

  @IsOptional()
  @IsBoolean()
  routingSuez?: boolean;

  @IsOptional()
  @IsBoolean()
  routingPanama?: boolean;

  @IsOptional()
  @IsBoolean()
  routingKiel?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marginSeaDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  marginPortIdleDays?: number;

  @IsOptional()
  @IsNumber()
  otherResultAmount?: number;

  @IsOptional()
  @IsIn(['DAYS', 'HOURS'])
  timeDisplayUnit?: 'DAYS' | 'HOURS';

  @IsOptional()
  @IsIn(['PORT_LOCAL', 'UTC'])
  timezoneDisplayMode?: 'PORT_LOCAL' | 'UTC';
}

export class CargoReletFreightTermDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  freightRate?: number;

  @IsOptional()
  @IsString()
  freightType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freightLumpsum?: number;

  @IsOptional()
  @IsNumber()
  addCommPct?: number;

  @IsOptional()
  @IsNumber()
  brokeragePct?: number;

  @IsOptional()
  @IsNumber()
  netFreight?: number;

  @IsOptional()
  @IsNumber()
  linerCostAmount?: number;
}

export class CargoReletCargoLineDto {
  @IsInt()
  @Min(1)
  lineNo!: number;

  @IsOptional()
  @IsString()
  accountCompanyId?: string;

  @IsOptional()
  @IsString()
  cargoId?: string;

  @IsOptional()
  @IsString()
  cargoName?: string;

  @IsOptional()
  @IsString()
  loadingPortId?: string;

  @IsOptional()
  @IsString()
  dischargingPortId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityMt?: number;

  @IsOptional()
  @IsString()
  quantityUnit?: string;

  @ValidateNested()
  @Type(() => CargoReletFreightTermDto)
  head!: CargoReletFreightTermDto;

  @ValidateNested()
  @Type(() => CargoReletFreightTermDto)
  sub!: CargoReletFreightTermDto;
}

export class CargoReletPortCpTermDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  ldRate?: number;

  @IsOptional()
  @IsNumber()
  demurrage?: number;

  @IsOptional()
  @IsNumber()
  despatch?: number;
}

export class CargoReletPortLegDto {
  @IsInt()
  @Min(1)
  legNo!: number;

  @IsIn(['BALLAST', 'LOADING', 'DISCHARGE', 'CANAL', 'BUNKER', 'OTHER'])
  legType!: 'BALLAST' | 'LOADING' | 'DISCHARGE' | 'CANAL' | 'BUNKER' | 'OTHER';

  @IsOptional()
  @IsString()
  portId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceNm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ecaNm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wfPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  speedKn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  seaDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  portIdleDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  portWorkingDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  portCharge?: number;

  @IsOptional()
  @IsString()
  arrivalAt?: string;

  @IsOptional()
  @IsString()
  departureAt?: string;

  @ValidateNested()
  @Type(() => CargoReletPortCpTermDto)
  head!: CargoReletPortCpTermDto;

  @ValidateNested()
  @Type(() => CargoReletPortCpTermDto)
  sub!: CargoReletPortCpTermDto;
}

export class SaveCargoReletEstimateDto {
  @ValidateNested()
  @Type(() => CargoReletHeaderDto)
  header!: CargoReletHeaderDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoReletCargoLineDto)
  cargoLines!: CargoReletCargoLineDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoReletPortLegDto)
  portLegs!: CargoReletPortLegDto[];
}
