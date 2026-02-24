import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { ReportStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { REPORTS_QUEUE } from "./reports.service";

@Processor(REPORTS_QUEUE)
export class ReportsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ reportRunId: string; reportType: string; filters: Record<string, unknown> }>): Promise<void> {
    const { reportRunId, reportType } = job.data;
    await this.prisma.reportRun.update({
      where: { id: reportRunId },
      data: { status: ReportStatus.PROCESSING }
    });

    try {
      const outputPath = `/tmp/reports/${reportType}-${reportRunId}.json`;
      await this.prisma.reportRun.update({
        where: { id: reportRunId },
        data: {
          status: ReportStatus.COMPLETED,
          outputPath
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown report failure";
      await this.prisma.reportRun.update({
        where: { id: reportRunId },
        data: {
          status: ReportStatus.FAILED,
          errorMessage: message
        }
      });
      throw error;
    }
  }
}
