import { IsString, IsUUID } from "class-validator";

export class CreateWastageDto {
  @IsUUID()
  locationId!: string;

  @IsUUID()
  itemId!: string;

  @IsString()
  qty!: string;

  @IsString()
  reasonCode!: string;

  @IsString()
  businessDate!: string;
}

