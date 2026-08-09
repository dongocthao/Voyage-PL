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

export class TimeCharterHeaderDto {
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

  @IsIn(['TCOV'])
  estimateTypeCode!: 'TCOV';

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
  @IsIn(['DAYS', 'HOURS'])
  timeDisplayUnit?: 'DAYS' | 'HOURS';

  @IsOptional()
  @IsIn(['PORT_LOCAL', 'UTC'])
  timezoneDisplayMode?: 'PORT_LOCAL' | 'UTC';
}

export class TimeCharterDurationPeriodDto {
  @IsInt()
  @Min(1)
  periodNo!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyHire?: number;
}

export class TimeCharterTermDto {
  @IsIn(['HEAD', 'SUB'])
  cpSide!: 'HEAD' | 'SUB';

  @IsOptional()
  @IsString()
  accountCompanyId?: string;

  @IsOptional()
  @IsString()
  deliveryPortId?: string;

  @IsOptional()
  @IsString()
  redeliveryPortId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyHire?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  grossHire?: number;

  @IsOptional()
  @IsNumber()
  addCommPct?: number;

  @IsOptional()
  @IsNumber()
  brokeragePct?: number;

  @IsBoolean()
  useMultiDuration!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeCharterDurationPeriodDto)
  durationPeriods!: TimeCharterDurationPeriodDto[];
}

export class TimeCharterPortLegDto {
  @IsInt()
  @Min(1)
  legNo!: number;

  @IsIn(['BALLAST', 'DELIVERY', 'REDELIVERY', 'CANAL', 'BUNKER', 'OTHER'])
  legType!: 'BALLAST' | 'DELIVERY' | 'REDELIVERY' | 'CANAL' | 'BUNKER' | 'OTHER';

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
  @IsString()
  arrivalAt?: string;

  @IsOptional()
  @IsString()
  departureAt?: string;
}

export class SaveTimeCharterEstimateDto {
  @ValidateNested()
  @Type(() => TimeCharterHeaderDto)
  header!: TimeCharterHeaderDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeCharterTermDto)
  charterTerms!: TimeCharterTermDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeCharterPortLegDto)
  portLegs!: TimeCharterPortLegDto[];
}
