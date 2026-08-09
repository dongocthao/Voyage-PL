import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { SaveVoyageEstimateDto } from './voyage-estimate-snapshot.dto';

export class FreightSimulationDto {
  @ValidateNested()
  @Type(() => SaveVoyageEstimateDto)
  snapshot!: SaveVoyageEstimateDto;

  @IsOptional()
  @IsNumber()
  targetProfitUsd?: number;

  @IsOptional()
  @IsNumber()
  targetDailyProfit?: number;
}

export class AnalyzerScenarioDto {
  @IsIn(['FREIGHT', 'HIRE', 'QUANTITY', 'BUNKER_PRICE'])
  variable!: 'FREIGHT' | 'HIRE' | 'QUANTITY' | 'BUNKER_PRICE';

  @IsArray()
  @IsNumber({}, { each: true })
  deltas!: number[];
}

export class AnalyzerSimulationDto {
  @ValidateNested()
  @Type(() => SaveVoyageEstimateDto)
  snapshot!: SaveVoyageEstimateDto;

  @ValidateNested()
  @Type(() => AnalyzerScenarioDto)
  scenario!: AnalyzerScenarioDto;
}

export class ReletFreightSideDto {
  @IsIn(['F', 'L'])
  freightType!: 'F' | 'L';

  @IsOptional()
  @IsNumber()
  freightRate?: number;

  @IsOptional()
  @IsNumber()
  freightLumpsum?: number;

  @IsOptional()
  @IsNumber()
  addCommPct?: number;

  @IsOptional()
  @IsNumber()
  brokeragePct?: number;

  @IsOptional()
  @IsNumber()
  linerCostAmount?: number;
}

export class CargoReletLineDto {
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ValidateNested()
  @Type(() => ReletFreightSideDto)
  head!: ReletFreightSideDto;

  @ValidateNested()
  @Type(() => ReletFreightSideDto)
  sub!: ReletFreightSideDto;
}

export class CargoReletPortTermDto {
  @IsOptional()
  @IsNumber()
  headDemurrage?: number;

  @IsOptional()
  @IsNumber()
  headDespatch?: number;

  @IsOptional()
  @IsNumber()
  subDemurrage?: number;

  @IsOptional()
  @IsNumber()
  subDespatch?: number;
}

export class CargoReletCalculationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoReletLineDto)
  cargoLines!: CargoReletLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargoReletPortTermDto)
  portTerms?: CargoReletPortTermDto[];
}

export class TimeCharterPeriodDto {
  @IsNumber()
  @Min(0)
  durationDays!: number;

  @IsNumber()
  hirePerDay!: number;
}

export class TimeCharterSideDto {
  @IsNumber()
  @Min(0)
  totalDurationDays!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  optionDays?: number;

  @IsOptional()
  @IsNumber()
  addCommPct?: number;

  @IsOptional()
  @IsNumber()
  brokeragePct?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeCharterPeriodDto)
  periods!: TimeCharterPeriodDto[];
}

export class TimeCharterCalculationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeCharterSideDto)
  head?: TimeCharterSideDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeCharterSideDto)
  sub?: TimeCharterSideDto;
}
