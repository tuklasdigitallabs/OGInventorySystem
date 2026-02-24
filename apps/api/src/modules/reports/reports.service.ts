import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../../common/types/auth-user.type";
import { RequestReportDto } from "./dto/request-report.dto";

export const REPORTS_QUEUE = "reports";

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue(REPORTS_QUEUE) private readonly queue: Queue
  ) {}

  async request(dto: RequestReportDto, actor: AuthUser): Promise<{ reportRunId: string }> {
    const reportRun = await this.prisma.reportRun.create({
      data: {
        reportType: dto.reportType,
        requestedBy: actor.id,
        filtersJson: dto.filters as Prisma.InputJsonValue
      }
    });
    await this.queue.add("generate", {
      reportRunId: reportRun.id,
      reportType: dto.reportType,
      filters: dto.filters
    });
    await this.audit.log({
      userId: actor.id,
      action: "REPORT_REQUEST",
      entityType: "REPORT_RUN",
      entityId: reportRun.id,
      details: { reportType: dto.reportType }
    });
    return { reportRunId: reportRun.id };
  }

  async getStatus(reportRunId: string): Promise<{
    id: string;
    status: string;
    outputPath: string | null;
    errorMessage: string | null;
  }> {
    const run = await this.prisma.reportRun.findUniqueOrThrow({ where: { id: reportRunId } });
    return {
      id: run.id,
      status: run.status,
      outputPath: run.outputPath,
      errorMessage: run.errorMessage
    };
  }
}
