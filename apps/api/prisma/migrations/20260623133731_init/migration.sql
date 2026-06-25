-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `staffCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `locationArea` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'MANAGER', 'SUPERVISOR', 'ACCOUNT_MANAGER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `deletePermission` BOOLEAN NOT NULL DEFAULT false,
    `profileImageUrl` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_staffCode_key`(`staffCode`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_username_idx`(`username`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kiosks` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `profileImageUrl` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kiosks_username_key`(`username`),
    INDEX `kiosks_username_idx`(`username`),
    INDEX `kiosks_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sizes` (
    `id` VARCHAR(191) NOT NULL,
    `height` DECIMAL(10, 2) NOT NULL,
    `width` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `productType` ENUM('EMAIL', 'MAGNET', 'OTHERS', 'CERTIFICATE_LEFT_1', 'CERTIFICATE_LEFT_2', 'CERTIFICATE_RIGHT_1') NOT NULL DEFAULT 'OTHERS',
    `photoLimit` INTEGER NOT NULL DEFAULT 1,
    `sizeId` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `products_sizeId_idx`(`sizeId`),
    INDEX `products_status_idx`(`status`),
    INDEX `products_productType_idx`(`productType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `combo_products` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `thumbnailUrl` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `combo_products_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `combo_product_items` (
    `id` VARCHAR(191) NOT NULL,
    `comboProductId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    INDEX `combo_product_items_comboProductId_idx`(`comboProductId`),
    INDEX `combo_product_items_productId_idx`(`productId`),
    UNIQUE INDEX `combo_product_items_comboProductId_productId_key`(`comboProductId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discounts` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `discounts_code_key`(`code`),
    INDEX `discounts_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `frames` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `frames_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `object_masters` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `object_masters_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ultra_objects` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ultra_objects_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ultra_object_items` (
    `id` VARCHAR(191) NOT NULL,
    `ultraObjectId` VARCHAR(191) NOT NULL,
    `objectId` VARCHAR(191) NOT NULL,

    INDEX `ultra_object_items_ultraObjectId_idx`(`ultraObjectId`),
    INDEX `ultra_object_items_objectId_idx`(`objectId`),
    UNIQUE INDEX `ultra_object_items_ultraObjectId_objectId_key`(`ultraObjectId`, `objectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderCode` VARCHAR(191) NOT NULL,
    `kioskId` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `discountId` VARCHAR(191) NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `paymentType` ENUM('CASH', 'CARD', 'QR') NOT NULL DEFAULT 'CASH',
    `price` DECIMAL(10, 2) NOT NULL,
    `paymentStatus` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderCode_key`(`orderCode`),
    INDEX `orders_kioskId_idx`(`kioskId`),
    INDEX `orders_staffId_idx`(`staffId`),
    INDEX `orders_discountId_idx`(`discountId`),
    INDEX `orders_paymentStatus_idx`(`paymentStatus`),
    INDEX `orders_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_combos` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `comboProductId` VARCHAR(191) NOT NULL,
    `comboCode` VARCHAR(191) NOT NULL,
    `priceSnapshot` DECIMAL(10, 2) NOT NULL,
    `descriptionSnapshot` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_combos_orderId_idx`(`orderId`),
    INDEX `order_combos_comboProductId_idx`(`comboProductId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_photos` (
    `id` VARCHAR(191) NOT NULL,
    `orderComboId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `photographerId` VARCHAR(191) NULL,
    `frameId` VARCHAR(191) NULL,
    `folderLabel` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_photos_orderComboId_idx`(`orderComboId`),
    INDEX `order_photos_productId_idx`(`productId`),
    INDEX `order_photos_photographerId_idx`(`photographerId`),
    INDEX `order_photos_frameId_idx`(`frameId`),
    INDEX `order_photos_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `sizes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `combo_product_items` ADD CONSTRAINT `combo_product_items_comboProductId_fkey` FOREIGN KEY (`comboProductId`) REFERENCES `combo_products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `combo_product_items` ADD CONSTRAINT `combo_product_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ultra_object_items` ADD CONSTRAINT `ultra_object_items_ultraObjectId_fkey` FOREIGN KEY (`ultraObjectId`) REFERENCES `ultra_objects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ultra_object_items` ADD CONSTRAINT `ultra_object_items_objectId_fkey` FOREIGN KEY (`objectId`) REFERENCES `object_masters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_kioskId_fkey` FOREIGN KEY (`kioskId`) REFERENCES `kiosks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `discounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_combos` ADD CONSTRAINT `order_combos_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_combos` ADD CONSTRAINT `order_combos_comboProductId_fkey` FOREIGN KEY (`comboProductId`) REFERENCES `combo_products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_photos` ADD CONSTRAINT `order_photos_orderComboId_fkey` FOREIGN KEY (`orderComboId`) REFERENCES `order_combos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_photos` ADD CONSTRAINT `order_photos_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_photos` ADD CONSTRAINT `order_photos_photographerId_fkey` FOREIGN KEY (`photographerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_photos` ADD CONSTRAINT `order_photos_frameId_fkey` FOREIGN KEY (`frameId`) REFERENCES `frames`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
