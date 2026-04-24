CREATE TABLE `guest_visit_reactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `guestVisitId` INTEGER NOT NULL,
    `reactionType` ENUM('heart', 'bouquet', 'sparkle') NOT NULL,
    `reactorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `guest_visit_reactions_guestVisitId_reactionType_reactorId_key`(`guestVisitId`, `reactionType`, `reactorId`),
    INDEX `guest_visit_reactions_guestVisitId_idx`(`guestVisitId`),
    INDEX `guest_visit_reactions_reactionType_idx`(`reactionType`),
    INDEX `guest_visit_reactions_reactorId_idx`(`reactorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `guest_visit_reactions`
ADD CONSTRAINT `guest_visit_reactions_guestVisitId_fkey`
FOREIGN KEY (`guestVisitId`) REFERENCES `guest_visits`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
