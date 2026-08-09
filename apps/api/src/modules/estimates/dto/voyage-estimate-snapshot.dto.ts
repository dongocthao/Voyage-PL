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

export class VoyageFreightTermDto {
  @IsOptional()
  @IsNumber()
  freightRate?: number;

  @IsOptional()
  @IsInt()
  freightTermId?: number;

  @IsOptional()
  @IsNumber()
  addCommPct?: number;

  @IsOptional()
  @IsNumber()
  brokeragePct?: number;

  @IsOptional()
  @IsNumber()
  freightTaxPct?: number;

  @IsIn(['F', 'L'])
  freightType!: 'F' | 'L';

  @IsOptional()
  @IsNumber()
  freightLumpsum?: number;

  @IsOptional()
  @IsNumber()
  linerCostAmount?: number;

  @IsOptional()
  @IsBoolean()
  isFreightFixed?: boolean;
}

export class VoyageCargoLineDto {
  @IsInt()
  @Min(1)
  lineNo!: number;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  accountCompanyId?: string;

  @IsOptional()
  @IsString()
  cargoId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
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
  quantity?: number;

  @IsString()
  @MaxLength(20)
  unit!: string;

  @ValidateNested()
  @Type(() => VoyageFreightTermDto)
  freight!: VoyageFreightTermDto;
}

export class VoyagePortLegCpTermDto {
  @IsOptional()
  @IsNumber()
  ldRate?: number;

  @IsOptional()
  @IsInt()
  laytimeTermId?: number;

  @IsOptional()
  @IsNumber()
  demurrage?: number;

  @IsOptional()
  @IsNumber()
  despatch?: number;
}

export class VoyagePortLegDto {
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
  portCharge?: number;

  @IsOptional()
  @IsString()
  arrivalAt?: string;

  @IsOptional()
  @IsString()
  departureAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VoyagePortLegCpTermDto)
  cpTerm?: VoyagePortLegCpTermDto;
}

export class VoyageBunkerRateDto {
  @IsIn(['MAIN', 'SUB'])
  role!: 'MAIN' | 'SUB';

  @IsIn(['NORMAL', 'ECA'])
  condition!: 'NORMAL' | 'ECA';

  @IsIn(['BALLAST', 'LADEN', 'IDLE', 'WORK', 'SEA'])
  activity!: 'BALLAST' | 'LADEN' | 'IDLE' | 'WORK' | 'SEA';

  @IsInt()
  fuelTypeId!: number;

  @IsOptional()
  @IsString()
  fuelCode?: string;

  @IsNumber()
  @Min(0)
  consumptionMtDay!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerMt?: number;
}

export class VoyageOperationExpenseItemDto {
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  categoryCode?: string;

  @IsOptional()
  @IsIn(['HEAD', 'SUB'])
  cpSide?: 'HEAD' | 'SUB';

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class VoyageMiscItemDto {
  @IsInt()
  @Min(1)
  itemId!: number;

  @IsString()
  @MaxLength(200)
  itemDescription!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  itemType?: string;

  @IsNumber()
  @Min(0)
  itemAmount!: number;

  @IsOptional()
  @IsIn(['HEAD', 'SUB'])
  cpSide?: 'HEAD' | 'SUB';
}

export class VoyageEstimateHeaderDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(20)
  estimateTypeCode?: string;

  @IsOptional()
  @IsInt()
  sheetOrder?: number;

  @IsOptional()
  @IsIn(['DRAFT', 'CONFIRMED', 'FIXED', 'LOST', 'CANCELLED'])
  status?: 'DRAFT' | 'CONFIRMED' | 'FIXED' | 'LOST' | 'CANCELLED';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  voyageNo?: string;

  @IsOptional()
  @IsString()
  remark?: string;

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
  @Min(0)
  hireDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hireAddCommPct?: number;

  @IsOptional()
  @IsIn(['DAYS', 'HOURS'])
  timeDisplayUnit?: 'DAYS' | 'HOURS';

  @IsOptional()
  @IsIn(['PORT_LOCAL', 'UTC'])
  timezoneDisplayMode?: 'PORT_LOCAL' | 'UTC';
}

export class SaveVoyageEstimateDto {
  @ValidateNested()
  @Type(() => VoyageEstimateHeaderDto)
  header!: VoyageEstimateHeaderDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoyageCargoLineDto)
  cargoLines!: VoyageCargoLineDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoyagePortLegDto)
  portLegs!: VoyagePortLegDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoyageBunkerRateDto)
  bunkerProfile?: VoyageBunkerRateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoyageOperationExpenseItemDto)
  operationExpenseItems?: VoyageOperationExpenseItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoyageMiscItemDto)
  miscOperationExpenseItems?: VoyageMiscItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoyageMiscItemDto)
  miscVoyageRevenueItems?: VoyageMiscItemDto[];
}
