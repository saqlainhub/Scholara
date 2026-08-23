-- AlterTable
ALTER TABLE "DailyRecord" ADD COLUMN     "taskTemplateId" TEXT;

-- CreateIndex
CREATE INDEX "DailyRecord_taskTemplateId_idx" ON "DailyRecord"("taskTemplateId");

-- AddForeignKey
ALTER TABLE "DailyRecord" ADD CONSTRAINT "DailyRecord_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
