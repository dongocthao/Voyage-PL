import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OperationHeaderDto {
  @IsOptional()
  @IsString()
  operationId?: string;

  @IsOptional()
  @IsString()
  estimateId?: string;

  @IsOptional()
  @IsString()
  vesselId?: string;

  @IsString()
  @MaxLength(150)
  vesselName!: string;

  @IsString()
  @MaxLength(50)
  voyageNo!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

export class OperationCargoRowDto {
  @IsNumber()
  @Min(1)
  lineNo!: number;

  @IsOptional()
  @IsString()
  account?: string;

  @IsOptional()
  @IsString()
  cargoName?: string;

  @IsOptional()
  @IsString()
  loadingPort?: string;

  @IsOptional()
  @IsString()
  dischargingPort?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsIn(['F', 'L'])
  frtType?: 'F' | 'L';

  @IsOptional()
  @IsNumber()
  @Min(0)
  freightRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freightLumpsum?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  linerCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalFreight?: number;
}

export class OperationPortRowDto {
  @IsNumber()
  @Min(1)
  lineNo!: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  portName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceNm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ecaNm?: number;

  @IsOptional()
  @IsString()
  arrival?: string;

  @IsOptional()
  @IsString()
  departure?: string;
}

export class OperationBunkerRowDto {
  @IsString()
  @MaxLength(10)
  fuelType!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerMt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  consumptionMt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expense?: number;
}

export class OperationReportFuelDto {
  @IsString()
  @MaxLength(10)
  fuelType!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  robMt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  supplyQtyMt?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  supplyUnitPrice?: number;
}

export class OperationActualReportDto {
  @IsString()
  portKey!: string;

  @IsIn(['arrival', 'departure'])
  kind!: 'arrival' | 'departure';

  @IsString()
  time!: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationReportFuelDto)
  fuels!: OperationReportFuelDto[];
}

export class SaveOperationSnapshotDto {
  @ValidateNested()
  @Type(() => OperationHeaderDto)
  header!: OperationHeaderDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationCargoRowDto)
  cargoRows!: OperationCargoRowDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationPortRowDto)
  portRows!: OperationPortRowDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationBunkerRowDto)
  bunkerRows!: OperationBunkerRowDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperationActualReportDto)
  reports!: OperationActualReportDto[];
}
