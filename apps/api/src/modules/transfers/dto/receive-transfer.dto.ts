import { Type } from "class-transformer";
import { IsArray, IsString, IsUUID, ValidateNested } from "class-validator";

class ReceiveTransferLineDto {
  @IsUUID()
  transferLineId!: string;

  @IsString()
  qtyReceived!: string;
}

export class ReceiveTransferDto {
  @IsString()
  businessDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveTransferLineDto)
  lines!: ReceiveTransferLineDto[];
}

