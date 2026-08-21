import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SaveOperationPortActivitiesDto {
  @IsString()
  operationId!: string;

  @IsNumber()
  @Min(1)
  portRotationId!: number;

  @IsOptional()
  @IsString()
  portName?: string;

  @IsNumber()
  @Min(0)
  channelDays!: number;

  @IsNumber()
  @Min(0)
  portWorkingDays!: number;

  @IsNumber()
  @Min(0)
  portIdleDays!: number;

  @IsNumber()
  @Min(0)
  portMarginDay!: number;

  @IsNumber()
  @Min(0)
  portStayDuration!: number;
}
