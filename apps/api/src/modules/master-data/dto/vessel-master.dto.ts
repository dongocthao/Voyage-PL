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

export class VesselGearDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(30)
  gearType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  position?: string;

  @IsOptional()
  @IsNumber()
  capacityMt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  qtyEa?: number;
}

export class VesselBunkerConsumptionDto {
  @IsIn(['MAIN', 'SUB'])
  fuelRole!: 'MAIN' | 'SUB';

  @IsIn(['NORMAL', 'ECA'])
  condition!: 'NORMAL' | 'ECA';

  @IsInt()
  fuelTypeId!: number;

  @IsIn(['BALLAST', 'LADEN', 'IDLE', 'WORK', 'SEA'])
  activity!: 'BALLAST' | 'LADEN' | 'IDLE' | 'WORK' | 'SEA';

  @IsNumber()
  @Min(0)
  consumptionMtDay!: number;
}

export class VesselPerformanceModeDto {
  @IsIn(['FULL', 'ECO', 'CUSTOM1', 'CUSTOM2', 'CUSTOM3'])
  mode!: 'FULL' | 'ECO' | 'CUSTOM1' | 'CUSTOM2' | 'CUSTOM3';

  @IsNumber()
  @Min(0)
  speedBallastKn!: number;

  @IsNumber()
  @Min(0)
  speedLadenKn!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VesselBunkerConsumptionDto)
  consumption!: VesselBunkerConsumptionDto[];
}

export class VesselBunkerProfileDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(100)
  profileName!: string;

  @IsString()
  effectiveFrom!: string;

  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VesselPerformanceModeDto)
  modes!: VesselPerformanceModeDto[];
}

export class UpsertVesselMasterDto {
  @IsString()
  @MaxLength(150)
  mvName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  imoNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  callSign?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  vesselCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hullNo?: string;

  @IsIn(['OWNED', 'CHARTERED', 'MANAGED'])
  ownership!: 'OWNED' | 'CHARTERED' | 'MANAGED';

  @IsOptional()
  @IsString()
  ownerCompanyId?: string;

  @IsOptional()
  @IsInt()
  vesselKindId?: number;

  @IsOptional()
  @IsInt()
  vesselTypeId?: number;

  @IsOptional()
  @IsString()
  flag?: string;

  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @IsInt()
  builtYear?: number;

  @IsOptional()
  @IsNumber()
  dwt?: number;

  @IsOptional()
  @IsNumber()
  dwcc?: number;

  @IsOptional()
  @IsNumber()
  draftM?: number;

  @IsOptional()
  @IsNumber()
  loaM?: number;

  @IsOptional()
  @IsNumber()
  beamM?: number;

  @IsOptional()
  @IsNumber()
  depthM?: number;

  @IsOptional()
  @IsNumber()
  grt?: number;

  @IsOptional()
  @IsNumber()
  nrt?: number;

  @IsOptional()
  @IsNumber()
  scnt?: number;

  @IsOptional()
  @IsNumber()
  pcUmsNt?: number;

  @IsOptional()
  @IsNumber()
  tpc?: number;

  @IsOptional()
  @IsNumber()
  grainCbm?: number;

  @IsOptional()
  @IsNumber()
  baleCbm?: number;

  @IsOptional()
  @IsNumber()
  constantMt?: number;

  @IsOptional()
  @IsString()
  iceClass?: string;

  @IsOptional()
  @IsString()
  wap?: string;

  @IsOptional()
  @IsString()
  hoHaType?: string;

  @IsOptional()
  @IsString()
  hoHaGear?: string;

  @IsOptional()
  @IsNumber()
  tankTopStrengthUpper?: number;

  @IsOptional()
  @IsNumber()
  tankTopStrengthTween?: number;

  @IsOptional()
  @IsNumber()
  hatchCoverStrength?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VesselGearDto)
  gears!: VesselGearDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VesselBunkerProfileDto)
  bunkerProfiles!: VesselBunkerProfileDto[];
}
