import { IsObject, IsString } from "class-validator";

export class RequestReportDto {
  @IsString()
  reportType!: string;

  @IsObject()
  filters!: Record<string, unknown>;
}

