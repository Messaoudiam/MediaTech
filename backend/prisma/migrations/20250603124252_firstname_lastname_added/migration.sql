-- AlterTable
ALTER TABLE "users" ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT 'Prénom',
ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT 'Nom';
