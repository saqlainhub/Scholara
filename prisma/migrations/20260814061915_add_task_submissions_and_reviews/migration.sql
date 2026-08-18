/*
  Warnings:

  - You are about to alter the column `score` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `attempt` on the `TaskSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `checkedAt` on the `TaskSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TaskSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `teacherNote` on the `TaskSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `teacherReview` on the `TaskSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `TaskSubmissionMedia` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `TaskSubmissionMedia` table. All the data in the column will be lost.
  - Added the required column `studentId` to the `TaskSubmission` table without a default value. This is not possible if the table is not empty.
  - Made the column `publicId` on table `TaskSubmissionMedia` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "TaskSubmission_taskId_key";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "score" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "TaskSubmission" DROP COLUMN "attempt",
DROP COLUMN "checkedAt",
DROP COLUMN "createdAt",
DROP COLUMN "teacherNote",
DROP COLUMN "teacherReview",
ADD COLUMN     "studentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TaskSubmissionMedia" DROP COLUMN "fileSize",
DROP COLUMN "mimeType",
ADD COLUMN     "bytes" INTEGER,
ADD COLUMN     "format" TEXT,
ALTER COLUMN "publicId" SET NOT NULL;

-- CreateTable
CREATE TABLE "TaskReview" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskReview_taskId_key" ON "TaskReview"("taskId");

-- CreateIndex
CREATE INDEX "TaskReview_teacherId_idx" ON "TaskReview"("teacherId");

-- CreateIndex
CREATE INDEX "TaskSubmission_taskId_idx" ON "TaskSubmission"("taskId");

-- CreateIndex
CREATE INDEX "TaskSubmission_studentId_idx" ON "TaskSubmission"("studentId");

-- AddForeignKey
ALTER TABLE "TaskSubmission" ADD CONSTRAINT "TaskSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReview" ADD CONSTRAINT "TaskReview_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReview" ADD CONSTRAINT "TaskReview_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
