-- AlterTable
ALTER TABLE `users` ADD COLUMN `isPhotographer` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `users_isPhotographer_idx` ON `users`(`isPhotographer`);
