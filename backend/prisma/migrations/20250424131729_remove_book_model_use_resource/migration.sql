/*
  Warnings:

  - You are about to drop the column `bookId` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the `books` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,resourceId]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resourceId` to the `favorites` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_bookId_fkey";

-- DropIndex
DROP INDEX "favorites_userId_bookId_key";

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "publishedYear" INTEGER;

-- AlterTable
ALTER TABLE "favorites" DROP COLUMN "bookId",
ADD COLUMN     "resourceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "books";

-- CreateIndex
CREATE INDEX "Resource_author_idx" ON "Resource"("author");

-- CreateIndex
CREATE INDEX "Resource_genre_idx" ON "Resource"("genre");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_resourceId_key" ON "favorites"("userId", "resourceId");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
