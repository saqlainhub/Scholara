-- AlterTable
ALTER TABLE "StudentAwardStats" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastStreakDate" DATE,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StudentAwardEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAwardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentAwardEvent_studentId_idx" ON "StudentAwardEvent"("studentId");

-- CreateIndex
CREATE INDEX "StudentAwardEvent_type_idx" ON "StudentAwardEvent"("type");

-- CreateIndex
CREATE INDEX "StudentAwardEvent_periodKey_idx" ON "StudentAwardEvent"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAwardEvent_studentId_type_periodKey_key" ON "StudentAwardEvent"("studentId", "type", "periodKey");

-- AddForeignKey
ALTER TABLE "StudentAwardEvent" ADD CONSTRAINT "StudentAwardEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
