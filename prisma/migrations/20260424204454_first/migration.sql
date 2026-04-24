-- CreateTable
CREATE TABLE `guest_visits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `institutionOrigin` VARCHAR(160) NOT NULL,
    `address` VARCHAR(300) NOT NULL,
    `purpose` ENUM('DOA_RESTU', 'UCAPAN_BAHAGIA', 'CERITA_KENANGAN', 'NASIHAT_PERNIKAHAN', 'DOA_KELUARGA', 'HARAPAN_MASA_DEPAN', 'SALAM_KEHADIRAN', 'UCAPAN_LAINNYA') NOT NULL,
    `otherPurposeNote` VARCHAR(255) NULL,
    `photoFileId` VARCHAR(191) NOT NULL,
    `photoFileName` VARCHAR(191) NOT NULL,
    `photoFolderPath` VARCHAR(191) NOT NULL,
    `photoMimeType` VARCHAR(100) NOT NULL,
    `photoSizeBytes` INTEGER NOT NULL,
    `photoUploadedAt` DATETIME(3) NOT NULL,
    `visitAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `guest_visits_visitAt_idx`(`visitAt`),
    INDEX `guest_visits_purpose_idx`(`purpose`),
    INDEX `guest_visits_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `username` VARCHAR(191) NULL,
    `displayUsername` TEXT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    UNIQUE INDEX `user_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
