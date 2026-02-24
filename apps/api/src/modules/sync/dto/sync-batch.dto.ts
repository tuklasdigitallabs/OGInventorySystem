import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { LedgerReferenceType } from "@prisma/client";

class SyncEventDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  locationId!: string;

  @IsUUID()
  itemId!: string;

  @IsString()
  qtyIn!: string;

  @IsString()
  qtyOut!: string;

  @IsOptional()
  @IsString()
  unitCostAtTime?: string;

  @IsEnum(LedgerReferenceType)
  referenceType!: LedgerReferenceType;

  @IsString()
  referenceId!: string;

  @IsString()
  businessDate!: string;
}

export class SyncBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events!: SyncEventDto[];
}

export type SyncEventInput = SyncEventDto;

