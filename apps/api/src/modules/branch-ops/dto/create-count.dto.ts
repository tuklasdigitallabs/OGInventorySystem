import { Type } from "class-transformer";
import { IsArray, IsString, IsUUID, ValidateNested } from "class-validator";

class CountLineDto {
  @IsUUID()
  itemId!: string;

  @IsString()
  systemQty!: string;

  @IsString()
  countedQty!: string;

  @IsString()
  reasonCode!: string;
}

export class CreateCountDto {
  @IsUUID()
  locationId!: string;

  @IsString()
  businessDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountLineDto)
  lines!: CountLineDto[];
}

