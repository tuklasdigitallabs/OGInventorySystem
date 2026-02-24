import { IsArray, IsEmail, IsString, IsUUID, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsArray()
  @IsUUID("4", { each: true })
  roleIds!: string[];

  @IsArray()
  @IsUUID("4", { each: true })
  locationIds!: string[];
}

