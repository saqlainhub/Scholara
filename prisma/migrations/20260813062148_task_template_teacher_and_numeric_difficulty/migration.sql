/*
  Warnings:

  - Changed the type of `difficulty` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `difficulty` on the `TaskTemplateItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TaskTemplateItem" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Difficulty";
