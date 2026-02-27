-- CreateEnum
CREATE TYPE "AccountState" AS ENUM ('ACTIVE', 'GRACE_PERIOD', 'SUSPENDED');

-- CreateTable
CREATE TABLE "account_controls" (
    "id" INTEGER NOT NULL,
    "state" "AccountState" NOT NULL DEFAULT 'ACTIVE',
    "suspensionReason" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_controls_pkey" PRIMARY KEY ("id")
);

-- Seed singleton account control row
INSERT INTO "account_controls" ("id", "state", "updatedAt")
VALUES (1, 'ACTIVE', NOW())
ON CONFLICT ("id") DO NOTHING;
