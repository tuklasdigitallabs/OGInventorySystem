const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const rolePermissions = {
  Admin: [
    "MASTER_DATA_READ",
    "MASTER_DATA_WRITE",
    "USER_MANAGE",
    "LEDGER_POST",
    "LEDGER_READ",
    "PO_CREATE",
    "PO_RECEIVE",
    "TRANSFER_CREATE",
    "TRANSFER_DISPATCH",
    "TRANSFER_RECEIVE",
    "WASTAGE_CREATE",
    "COUNT_CREATE",
    "COUNT_SUBMIT",
    "COUNT_APPROVE",
    "ISSUE_TO_OPS",
    "SALES_BATCH_CREATE",
    "REPORT_RUN",
    "SYNC_BATCH",
    "INVENTORY_READ",
    "ACCOUNT_CONTROL_READ",
    "ACCOUNT_CONTROL_WRITE"
  ],
  "Warehouse Manager": ["PO_CREATE", "PO_RECEIVE", "TRANSFER_CREATE", "TRANSFER_DISPATCH", "LEDGER_READ", "INVENTORY_READ"],
  Purchasing: ["PO_CREATE", "PO_RECEIVE", "LEDGER_READ", "INVENTORY_READ"],
  "Branch Manager": ["TRANSFER_RECEIVE", "WASTAGE_CREATE", "COUNT_CREATE", "COUNT_SUBMIT", "COUNT_APPROVE", "ISSUE_TO_OPS", "SALES_BATCH_CREATE", "INVENTORY_READ"],
  "Branch Encoder": ["WASTAGE_CREATE", "COUNT_CREATE", "COUNT_SUBMIT", "SALES_BATCH_CREATE", "SYNC_BATCH", "INVENTORY_READ"],
  Auditor: ["LEDGER_READ", "REPORT_RUN", "INVENTORY_READ"],
  Viewer: ["INVENTORY_READ"]
};

async function main() {
  for (const permissionCode of new Set(Object.values(rolePermissions).flat())) {
    await prisma.permission.upsert({
      where: { code: permissionCode },
      update: {},
      create: { code: permissionCode, description: permissionCode }
    });
  }

  for (const roleName of Object.keys(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });

    for (const permissionCode of rolePermissions[roleName]) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  const defaultLocation = await prisma.location.upsert({
    where: { code: "WH-CENTRAL" },
    update: {},
    create: { code: "WH-CENTRAL", name: "Central Warehouse" }
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "Admin" } });
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@onegourmet.ph" },
    update: {},
    create: {
      email: "admin@onegourmet.ph",
      fullName: "System Admin",
      passwordHash
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id }
  });

  await prisma.userLocationAccess.upsert({
    where: {
      userId_locationId: { userId: admin.id, locationId: defaultLocation.id }
    },
    update: {},
    create: { userId: admin.id, locationId: defaultLocation.id }
  });

  await prisma.accountControl.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      state: "ACTIVE"
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
