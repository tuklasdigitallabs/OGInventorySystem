import { Type } from "class-transformer";
import { IsArray, IsString, IsUUID, ValidateNested } from "class-validator";

class ReceivePoLineDto {
  @IsUUID()
  poLineId!: string;

  @IsString()
  qtyReceived!: string;
}

export class ReceivePoDto {
  @IsString()
  businessDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePoLineDto)
  lines!: ReceivePoLineDto[];
}

