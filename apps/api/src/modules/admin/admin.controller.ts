import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AccountState } from "@prisma/client";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { AccountStateGuard } from "../../common/guards/account-state.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { CreateItemDto } from "./dto/create-item.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { SetAccountStateDto } from "./dto/set-account-state.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard, AccountStateGuard)
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

  @Get("account-control")
  @RequirePermissions("ACCOUNT_CONTROL_READ")
  async getAccountControl(): Promise<{ state: AccountState; reason: string | null; updatedAt: Date; updatedBy: string | null }> {
    return this.adminService.getAccountControl();
  }

  @Post("account-control")
  @RequirePermissions("ACCOUNT_CONTROL_WRITE")
  async setAccountControl(
    @Body() dto: SetAccountStateDto,
    @CurrentUser() user: AuthUser
  ): Promise<{ state: AccountState; reason: string | null; updatedAt: Date; updatedBy: string | null }> {
    return this.adminService.setAccountControl(
      {
        state: dto.state,
        reason: dto.reason
      },
      user
    );
  }
}
