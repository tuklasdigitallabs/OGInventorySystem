import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { AccountStateGuard } from "../../common/guards/account-state.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthUser } from "../../common/types/auth-user.type";
import { RequestReportDto } from "./dto/request-report.dto";
import { ReportsService } from "./reports.service";

@Controller("reports")
@UseGuards(JwtAuthGuard, PermissionsGuard, AccountStateGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post("runs")
  @RequirePermissions("REPORT_RUN")
  async requestRun(@Body() dto: RequestReportDto, @CurrentUser() user: AuthUser): Promise<{ reportRunId: string }> {
    return this.reportsService.request(dto, user);
  }

  @Get("runs/:id")
  @RequirePermissions("REPORT_RUN")
  async status(@Param("id") id: string): Promise<{
    id: string;
    status: string;
    outputPath: string | null;
    errorMessage: string | null;
  }> {
    return this.reportsService.getStatus(id);
  }
}
