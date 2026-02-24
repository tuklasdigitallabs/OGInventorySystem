import { IsEnum, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";
import { LedgerReferenceType } from "@prisma/client";

export class PostLedgerEventDto {
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

  @ValidateIf((o: PostLedgerEventDto) => o.qtyIn !== "0")
  @IsString()
  unitCostAtTime?: string;

  @IsEnum(LedgerReferenceType)
  referenceType!: LedgerReferenceType;

  @IsString()
  referenceId!: string;

  @IsString()
  businessDate!: string;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;
}

