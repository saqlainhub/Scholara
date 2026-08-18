-- DropForeignKey
ALTER TABLE "TaskTemplateItem" DROP CONSTRAINT "TaskTemplateItem_categoryId_fkey";

-- DropIndex
DROP INDEX "TaskCategory_name_key";

-- CreateTable
CREATE TABLE "TaskTemplateCategory" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplateCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskTemplateCategory_templateId_idx" ON "TaskTemplateCategory"("templateId");

-- CreateIndex
CREATE INDEX "TaskTemplateCategory_sortOrder_idx" ON "TaskTemplateCategory"("sortOrder");

-- AddForeignKey
ALTER TABLE "TaskTemplateCategory" ADD CONSTRAINT "TaskTemplateCategory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplateItem" ADD CONSTRAINT "TaskTemplateItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaskTemplateCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
