/*
  Warnings:

  - You are about to drop the column `error` on the `emails` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "emails" DROP COLUMN "error",
ADD COLUMN     "previewUrl" TEXT;
