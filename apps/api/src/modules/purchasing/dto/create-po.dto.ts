import { Type } from "class-transformer";
import { IsArray, IsString, IsUUID, ValidateNested } from "class-validator";

class CreatePoLineDto {
  @IsUUID()
  itemId!: string;

  @IsString()
  orderedQty!: string;

  @IsString()
  unitCost!: string;
}

export class CreatePoDto {
  @IsString()
  poNumber!: string;

  @IsUUID()
  supplierId!: string;

  @IsUUID()
  locationId!: string;

  @IsString()
  businessDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoLineDto)
  lines!: CreatePoLineDto[];
}

export type CreatePoLineInput = CreatePoLineDto;

