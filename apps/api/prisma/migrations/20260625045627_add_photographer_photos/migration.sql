-- CreateTable
CREATE TABLE `photographer_photos` (
    `id` VARCHAR(191) NOT NULL,
    `photographerId` VARCHAR(191) NOT NULL,
    `s3Key` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `photographer_photos_photographerId_idx`(`photographerId`),
    INDEX `photographer_photos_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `photographer_photos` ADD CONSTRAINT `photographer_photos_photographerId_fkey` FOREIGN KEY (`photographerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
