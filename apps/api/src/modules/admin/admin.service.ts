import { Injectable } from "@nestjs/common";
import { AccountState } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthUser } from "../../common/types/auth-user.type";
import { AuditService } from "../audit/audit.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async createItem(dto: CreateItemDto): Promise<{ id: string }> {
    const item = await this.prisma.item.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        categoryId: dto.categoryId,
        baseUomId: dto.baseUomId,
        isFood: dto.isFood,
        lowStockLevel: dto.lowStockLevel ? dto.lowStockLevel : undefined
      }
    });
    return { id: item.id };
  }

  async createUser(dto: CreateUserDto): Promise<{ id: string }> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        roles: {
          createMany: {
            data: dto.roleIds.map((roleId) => ({ roleId }))
          }
        },
        locationAccess: {
          createMany: {
            data: dto.locationIds.map((locationId) => ({ locationId }))
          }
        }
      }
    });
    return { id: user.id };
  }

  async listMasterData(): Promise<{
    locations: unknown[];
    categories: unknown[];
    uoms: unknown[];
    suppliers: unknown[];
    reasonCodes: unknown[];
  }> {
    const [locations, categories, uoms, suppliers, reasonCodes] = await Promise.all([
      this.prisma.location.findMany({ where: { isActive: true } }),
      this.prisma.category.findMany(),
      this.prisma.uom.findMany(),
      this.prisma.supplier.findMany(),
      this.prisma.reasonCode.findMany()
    ]);
    return { locations, categories, uoms, suppliers, reasonCodes };
  }

  async getAccountControl(): Promise<{ state: AccountState; reason: string | null; updatedAt: Date; updatedBy: string | null }> {
    const control = await this.prisma.accountControl.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, state: AccountState.ACTIVE }
    });

    return {
      state: control.state,
      reason: control.suspensionReason ?? null,
      updatedAt: control.updatedAt,
      updatedBy: control.updatedBy ?? null
    };
  }

  async setAccountControl(
    params: { state: AccountState; reason?: string },
    actor: AuthUser
  ): Promise<{ state: AccountState; reason: string | null; updatedAt: Date; updatedBy: string | null }> {
    const reason = params.reason?.trim() ?? null;
    const control = await this.prisma.accountControl.upsert({
      where: { id: 1 },
      update: {
        state: params.state,
        suspensionReason: params.state === AccountState.SUSPENDED ? reason : null,
        updatedBy: actor.id
      },
      create: {
        id: 1,
        state: params.state,
        suspensionReason: params.state === AccountState.SUSPENDED ? reason : null,
        updatedBy: actor.id
      }
    });

    await this.audit.log({
      userId: actor.id,
      action: "ACCOUNT_CONTROL_UPDATE",
      entityType: "AccountControl",
      entityId: String(control.id),
      details: {
        state: control.state,
        reason: control.suspensionReason ?? null
      }
    });

    return {
      state: control.state,
      reason: control.suspensionReason ?? null,
      updatedAt: control.updatedAt,
      updatedBy: control.updatedBy ?? null
    };
  }
}
