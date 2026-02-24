import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthUser } from "../types/auth-user.type";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: AuthUser }>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = authHeader.replace("Bearer ", "");
    const payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(token, {
      secret: process.env.JWT_ACCESS_SECRET
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        locationAccess: true
      }
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    request.user = {
      id: user.id,
      email: user.email,
      roleNames: user.roles.map((r) => r.role.name),
      permissionCodes: user.roles.flatMap((r) => r.role.permissions.map((p) => p.permission.code)),
      locationIds: user.locationAccess.map((a) => a.locationId)
    };

    return true;
  }
}

