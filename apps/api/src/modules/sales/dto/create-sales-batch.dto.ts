import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

class SalesBatchLineDto {
  @IsUUID()
  recipeId!: string;

  @IsString()
  qtySold!: string;
}

export class CreateSalesBatchDto {
  @IsUUID()
  locationId!: string;

  @IsString()
  businessDate!: string;

  @IsString()
  source!: string;

  @IsOptional()
  @IsString()
  externalRef?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesBatchLineDto)
  lines!: SalesBatchLineDto[];
}

