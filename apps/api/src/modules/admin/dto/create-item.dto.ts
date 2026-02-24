import { IsBoolean, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateItemDto {
  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  baseUomId!: string;

  @IsBoolean()
  isFood!: boolean;

  @IsOptional()
  @IsString()
  lowStockLevel?: string;
}

