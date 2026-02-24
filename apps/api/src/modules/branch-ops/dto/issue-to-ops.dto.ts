import { IsString, IsUUID } from "class-validator";

export class IssueToOpsDto {
  @IsUUID()
  locationId!: string;

  @IsUUID()
  itemId!: string;

  @IsString()
  qty!: string;

  @IsString()
  businessDate!: string;
}

