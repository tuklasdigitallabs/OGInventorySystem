import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthUser } from "../types/auth-user.type";

@Injectable()
export class LocationAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: AuthUser;
      body?: { locationId?: string };
      params?: { locationId?: string };
      query?: { locationId?: string };
    }>();
    const locationId =
      request.body?.locationId ?? request.params?.locationId ?? request.query?.locationId;
    if (!locationId) {
      return true;
    }
    if (!request.user.locationIds.includes(locationId)) {
      throw new ForbiddenException("User has no access to this location");
    }
    return true;
  }
}

