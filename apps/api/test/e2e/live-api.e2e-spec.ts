import * as request from "supertest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

describe("Live API E2E", () => {
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:4000";
  const prisma = new PrismaClient();
  const now = new Date();
  const businessDate = now.toISOString();

  let token = "";
  let centralLocationId = "";
  let branchLocationId = "";
  let categoryId = "";
  let uomId = "";
  let supplierId = "";
  let itemId = "";
  let recipeId = "";

  beforeAll(async () => {
    jest.setTimeout(120000);
    await prisma.$connect();

    const loginResponse = await request(baseUrl).post("/api/auth/login").send({
      email: "admin@onegourmet.ph",
      password: "ChangeMe123!"
    });
    expect(loginResponse.status).toBe(201);
    token = loginResponse.body.accessToken as string;
    expect(typeof token).toBe("string");

    const central = await prisma.location.findFirst({
      where: { code: "WH-CENTRAL" }
    });
    if (!central) {
      throw new Error("Missing WH-CENTRAL location. Run prisma seed first.");
    }
    centralLocationId = central.id;

    const branchCode = `BR-E2E-${Math.floor(Date.now() / 1000)}`;
    const branch = await prisma.location.create({
      data: {
        code: branchCode,
        name: `Branch E2E ${branchCode}`,
        isActive: true
      }
    });
    branchLocationId = branch.id;

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@onegourmet.ph" }
    });
    await prisma.userLocationAccess.upsert({
      where: {
        userId_locationId: {
          userId: admin.id,
          locationId: branch.id
        }
      },
      create: {
        userId: admin.id,
        locationId: branch.id
      },
      update: {}
    });

    const category = await prisma.category.create({
      data: { name: `E2E-Category-${randomUUID()}` }
    });
    categoryId = category.id;

    const uom = await prisma.uom.create({
      data: {
        code: `E2E${Math.floor(Math.random() * 10000)}`,
        name: `E2E UOM ${randomUUID().slice(0, 8)}`
      }
    });
    uomId = uom.id;

    const supplier = await prisma.supplier.create({
      data: { name: `E2E Supplier ${randomUUID().slice(0, 8)}` }
    });
    supplierId = supplier.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates item via admin endpoint", async () => {
    const response = await request(baseUrl)
      .post("/api/admin/items")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sku: `E2E-ITEM-${Date.now()}`,
        name: "E2E Chicken",
        categoryId,
        baseUomId: uomId,
        isFood: true,
        lowStockLevel: "5"
      });

    expect(response.status).toBe(201);
    itemId = response.body.id as string;
    expect(itemId).toBeTruthy();
  });

  it("creates PO, receives stock, and confirms stock-on-hand", async () => {
    const poResponse = await request(baseUrl)
      .post("/api/inventory/purchase-orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        poNumber: `E2E-PO-${Date.now()}`,
        supplierId,
        locationId: centralLocationId,
        businessDate,
        lines: [
          {
            itemId,
            orderedQty: "20",
            unitCost: "100"
          }
        ]
      });
    expect(poResponse.status).toBe(201);
    const poId = poResponse.body.id as string;

    const poLine = await prisma.purchaseOrderLine.findFirstOrThrow({
      where: { purchaseOrderId: poId }
    });

    const receiveResponse = await request(baseUrl)
      .post(`/api/inventory/purchase-orders/${poId}/receive`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        businessDate,
        lines: [{ poLineId: poLine.id, qtyReceived: "20" }]
      });
    expect(receiveResponse.status).toBe(201);
    expect(receiveResponse.body.receivedLines).toBe(1);

    const sohResponse = await request(baseUrl)
      .get(`/api/inventory/stock-on-hand?locationId=${centralLocationId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(sohResponse.status).toBe(200);
    const row = (sohResponse.body as Array<{ itemId: string; qtyOnHand: string }>).find((r) => r.itemId === itemId);
    expect(row).toBeDefined();
  });

  it("runs transfer dispatch and receive", async () => {
    const createTransfer = await request(baseUrl)
      .post("/api/inventory/transfers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        transferNumber: `E2E-TR-${Date.now()}`,
        fromLocationId: centralLocationId,
        toLocationId: branchLocationId,
        businessDate,
        lines: [{ itemId, qty: "5" }]
      });
    expect(createTransfer.status).toBe(201);
    const transferId = createTransfer.body.id as string;

    const transferLine = await prisma.transferLine.findFirstOrThrow({
      where: { transferId }
    });

    const dispatch = await request(baseUrl)
      .post(`/api/inventory/transfers/${transferId}/dispatch`)
      .set("Authorization", `Bearer ${token}`);
    expect(dispatch.status).toBe(201);
    expect(dispatch.body.status).toBe("DISPATCHED");

    const receive = await request(baseUrl)
      .post(`/api/inventory/transfers/${transferId}/receive`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        businessDate,
        lines: [{ transferLineId: transferLine.id, qtyReceived: "5" }]
      });
    expect(receive.status).toBe(201);
    expect(receive.body.status).toBe("RECEIVED");
  });

  it("posts sales batch and consumes stock via recipe BOM", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        code: `E2E-RCP-${Date.now()}`,
        name: "E2E Recipe"
      }
    });
    recipeId = recipe.id;
    await prisma.recipeLine.create({
      data: {
        recipeId,
        ingredientItemId: itemId,
        qtyPerSale: "0.5"
      }
    });

    const sales = await request(baseUrl)
      .post("/api/sales/batches")
      .set("Authorization", `Bearer ${token}`)
      .send({
        locationId: branchLocationId,
        businessDate,
        source: "POS",
        externalRef: `E2E-POS-${Date.now()}`,
        lines: [{ recipeId, qtySold: "4" }]
      });
    expect(sales.status).toBe(201);
    expect(sales.body.consumedEvents).toBeGreaterThan(0);
  });

  it("queues report and returns status", async () => {
    const run = await request(baseUrl)
      .post("/api/reports/runs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reportType: "STOCK_ON_HAND",
        filters: { locationId: branchLocationId }
      });
    expect(run.status).toBe(201);

    const runId = run.body.reportRunId as string;
    const status = await request(baseUrl)
      .get(`/api/reports/runs/${runId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(status.status).toBe(200);
    expect(["QUEUED", "PROCESSING", "COMPLETED"]).toContain(status.body.status);
  });

  it("processes sync batch idempotently", async () => {
    const syncEventId = randomUUID();
    const body = {
      events: [
        {
          id: syncEventId,
          locationId: branchLocationId,
          itemId,
          qtyIn: "0",
          qtyOut: "1",
          referenceType: "WASTAGE",
          referenceId: `E2E-SYNC-${Date.now()}`,
          businessDate
        }
      ]
    };

    const first = await request(baseUrl)
      .post("/api/sync/batch")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(first.status).toBe(201);
    expect(first.body.results[0].status).toBe("posted");

    const second = await request(baseUrl)
      .post("/api/sync/batch")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(second.status).toBe(201);
    expect(second.body.results[0].status).toBe("duplicate");
  });
});
