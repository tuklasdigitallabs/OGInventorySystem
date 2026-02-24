import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { LocationAccessGuard } from "../../common/guards/location-access.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { BranchOpsService } from "./branch-ops.service";
import { CreateWastageDto } from "./dto/create-wastage.dto";
import { CreateCountDto } from "./dto/create-count.dto";
import { IssueToOpsDto } from "./dto/issue-to-ops.dto";

@Controller("inventory/branch-ops")
@UseGuards(JwtAuthGuard, PermissionsGuard, LocationAccessGuard)
export class BranchOpsController {
  constructor(private readonly branchOpsService: BranchOpsService) {}

  @Post("wastage")
  @RequirePermissions("WASTAGE_CREATE")
  async wastage(@Body() dto: CreateWastageDto, @CurrentUser() user: AuthUser): Promise<{ id: string }> {
    return this.branchOpsService.recordWastage(dto, user);
  }

  @Post("counts")
  @RequirePermissions("COUNT_CREATE")
  async createCount(@Body() dto: CreateCountDto, @CurrentUser() user: AuthUser): Promise<{ id: string }> {
    return this.branchOpsService.createCount(dto, user);
  }

  @Post("counts/:id/submit")
  @RequirePermissions("COUNT_SUBMIT")
  async submitCount(@Param("id") id: string, @CurrentUser() user: AuthUser): Promise<{ id: string; status: string }> {
    const result = await this.branchOpsService.submitCount(id, user);
    return { id: result.id, status: result.status };
  }

  @Post("counts/:id/approve")
  @RequirePermissions("COUNT_APPROVE")
  async approveCount(@Param("id") id: string, @CurrentUser() user: AuthUser): Promise<{ id: string; status: string }> {
    const result = await this.branchOpsService.approveCount(id, user);
    return { id: result.id, status: result.status };
  }

  @Post("issue-to-ops")
  @RequirePermissions("ISSUE_TO_OPS")
  async issue(@Body() dto: IssueToOpsDto, @CurrentUser() user: AuthUser): Promise<{ referenceId: string }> {
    return this.branchOpsService.issueToOperations(dto, user);
  }
}

