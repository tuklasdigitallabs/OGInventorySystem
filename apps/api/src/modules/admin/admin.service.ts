import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
}

