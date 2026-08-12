import { IsObject } from 'class-validator';

export class UpsertSystemOptionsDto {
  @IsObject()
  settings!: Record<string, unknown>;
}

