/*
  Warnings:

  - You are about to drop the column `description` on the `RoutineTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `RoutineTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `RoutineTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `RoutineTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `TaskTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `TaskTemplate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,dayOfWeek]` on the table `StudentWeeklyTemplateAssignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdById` to the `RoutineTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudentWeeklyTemplateAssignment" DROP CONSTRAINT "StudentWeeklyTemplateAssignment_routineTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "StudentWeeklyTemplateAssignment" DROP CONSTRAINT "StudentWeeklyTemplateAssignment_taskTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "TaskTemplate" DROP CONSTRAINT "TaskTemplate_categoryId_fkey";

-- DropIndex
DROP INDEX "TaskTemplate_categoryId_idx";

-- AlterTable
ALTER TABLE "RoutineTemplate" DROP COLUMN "description",
DROP COLUMN "endTime",
DROP COLUMN "startTime",
DROP COLUMN "title",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TaskTemplate" DROP COLUMN "categoryId",
DROP COLUMN "deadline",
DROP COLUMN "description",
DROP COLUMN "difficulty",
DROP COLUMN "title";

-- CreateTable
CREATE TABLE "TaskTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTemplateItem_templateId_idx" ON "TaskTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "TaskTemplateItem_categoryId_idx" ON "TaskTemplateItem"("categoryId");

-- CreateIndex
CREATE INDEX "TaskTemplateItem_teacherId_idx" ON "TaskTemplateItem"("teacherId");

-- CreateIndex
CREATE INDEX "TaskTemplateItem_sortOrder_idx" ON "TaskTemplateItem"("sortOrder");

-- CreateIndex
CREATE INDEX "RoutineTemplateItem_templateId_idx" ON "RoutineTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "RoutineTemplateItem_sortOrder_idx" ON "RoutineTemplateItem"("sortOrder");

-- CreateIndex
CREATE INDEX "RoutineTemplate_createdById_idx" ON "RoutineTemplate"("createdById");

-- CreateIndex
CREATE INDEX "RoutineTemplate_name_idx" ON "RoutineTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StudentWeeklyTemplateAssignment_studentId_dayOfWeek_key" ON "StudentWeeklyTemplateAssignment"("studentId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TaskCategory_name_idx" ON "TaskCategory"("name");

-- CreateIndex
CREATE INDEX "TaskTemplate_name_idx" ON "TaskTemplate"("name");

-- AddForeignKey
ALTER TABLE "TaskTemplateItem" ADD CONSTRAINT "TaskTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplateItem" ADD CONSTRAINT "TaskTemplateItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaskCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplateItem" ADD CONSTRAINT "TaskTemplateItem_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTemplate" ADD CONSTRAINT "RoutineTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineTemplateItem" ADD CONSTRAINT "RoutineTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoutineTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentWeeklyTemplateAssignment" ADD CONSTRAINT "StudentWeeklyTemplateAssignment_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentWeeklyTemplateAssignment" ADD CONSTRAINT "StudentWeeklyTemplateAssignment_routineTemplateId_fkey" FOREIGN KEY ("routineTemplateId") REFERENCES "RoutineTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
