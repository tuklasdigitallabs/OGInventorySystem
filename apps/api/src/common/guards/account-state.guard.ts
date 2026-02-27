import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AccountState } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthUser } from "../types/auth-user.type";

@Injectable()
export class AccountStateGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ method: string; user?: AuthUser }>();
    const method = request.method.toUpperCase();

    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return true;
    }

    if (request.user?.roleNames.includes("Admin")) {
      return true;
    }

    const control = await this.prisma.accountControl.findUnique({ where: { id: 1 } });
    const state = control?.state ?? AccountState.ACTIVE;

    if (state === AccountState.SUSPENDED) {
      throw new ForbiddenException("Account is suspended. Contact administrator.");
    }

    return true;
  }
}
