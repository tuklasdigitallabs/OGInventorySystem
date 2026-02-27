import { AccountState } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class SetAccountStateDto {
  @IsEnum(AccountState)
  state!: AccountState;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
