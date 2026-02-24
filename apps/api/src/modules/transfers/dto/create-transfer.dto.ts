import { Type } from "class-transformer";
import { IsArray, IsString, IsUUID, ValidateNested } from "class-validator";

class CreateTransferLineDto {
  @IsUUID()
  itemId!: string;

  @IsString()
  qty!: string;
}

export class CreateTransferDto {
  @IsString()
  transferNumber!: string;

  @IsUUID()
  fromLocationId!: string;

  @IsUUID()
  toLocationId!: string;

  @IsString()
  businessDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransferLineDto)
  lines!: CreateTransferLineDto[];
}

