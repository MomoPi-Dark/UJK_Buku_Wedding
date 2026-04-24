CREATE TABLE `user` (
  `id` VARCHAR(191) NOT NULL,
  `name` TEXT NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `emailVerified` BOOLEAN NOT NULL DEFAULT FALSE,
  `image` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `username` VARCHAR(191) NULL,
  `displayUsername` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_key` (`email`),
  UNIQUE KEY `user_username_key` (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `session` (
  `id` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `ipAddress` TEXT NULL,
  `userAgent` TEXT NULL,
  `userId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token_key` (`token`),
  KEY `session_userId_idx` (`userId`),
  CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `account` (
  `id` VARCHAR(191) NOT NULL,
  `accountId` TEXT NOT NULL,
  `providerId` TEXT NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `accessToken` TEXT NULL,
  `refreshToken` TEXT NULL,
  `idToken` TEXT NULL,
  `accessTokenExpiresAt` DATETIME(3) NULL,
  `refreshTokenExpiresAt` DATETIME(3) NULL,
  `scope` TEXT NULL,
  `password` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_userId_idx` (`userId`),
  CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `verification` (
  `id` VARCHAR(191) NOT NULL,
  `identifier` TEXT NOT NULL,
  `value` TEXT NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `verification_identifier_idx` (`identifier`(191))
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `guest_visits` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `institutionOrigin` VARCHAR(160) NOT NULL,
  `address` VARCHAR(300) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `purpose` ENUM(
    'OBSERVASI_PPL_WAWANCARA',
    'PENAWARAN',
    'MENGANTAR_SURAT_PERANTARA',
    'INFORMASI_PMB',
    'LEGALISIR',
    'KONSULTASI_PENDIDIKAN',
    'PENJENGUKAN_SANTRI_SANTRIWATI',
    'LAYANAN_LAINNYA'
  ) NOT NULL,
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
  PRIMARY KEY (`id`),
  KEY `guest_visits_visitAt_idx` (`visitAt`),
  KEY `guest_visits_purpose_idx` (`purpose`),
  KEY `guest_visits_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
