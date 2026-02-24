import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CreateItemDto } from "./dto/create-item.dto";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("master-data")
  @RequirePermissions("MASTER_DATA_READ")
  async masterData(): Promise<{
    locations: unknown[];
    categories: unknown[];
    uoms: unknown[];
    suppliers: unknown[];
    reasonCodes: unknown[];
  }> {
    return this.adminService.listMasterData();
  }

  @Post("items")
  @RequirePermissions("MASTER_DATA_WRITE")
  async createItem(@Body() dto: CreateItemDto): Promise<{ id: string }> {
    return this.adminService.createItem(dto);
  }

  @Post("users")
  @RequirePermissions("USER_MANAGE")
  async createUser(@Body() dto: CreateUserDto): Promise<{ id: string }> {
    return this.adminService.createUser(dto);
  }
}

