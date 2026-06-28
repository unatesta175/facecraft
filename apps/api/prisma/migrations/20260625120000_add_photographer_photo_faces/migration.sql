-- AlterTable
ALTER TABLE `photographer_photos` ADD COLUMN `faceIndexStatus` ENUM('PENDING', 'INDEXED', 'NO_FACE', 'FAILED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `photographer_photos_faceIndexStatus_idx` ON `photographer_photos`(`faceIndexStatus`);

-- CreateTable
CREATE TABLE `photographer_photo_faces` (
    `id` VARCHAR(191) NOT NULL,
    `photographerPhotoId` VARCHAR(191) NOT NULL,
    `rekognitionFaceId` VARCHAR(191) NOT NULL,
    `confidence` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `photographer_photo_faces_rekognitionFaceId_key`(`rekognitionFaceId`),
    INDEX `photographer_photo_faces_photographerPhotoId_idx`(`photographerPhotoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `photographer_photo_faces` ADD CONSTRAINT `photographer_photo_faces_photographerPhotoId_fkey` FOREIGN KEY (`photographerPhotoId`) REFERENCES `photographer_photos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
