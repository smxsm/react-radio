ALTER TABLE `users` ADD COLUMN `access_level` INT(4) NOT NULL DEFAULT '0';

CREATE TABLE IF NOT EXISTS `user_rights` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `access_level` int(4) NOT NULL DEFAULT 0,
  `ident` varchar(255) DEFAULT NULL, 
  `value` varchar(255) DEFAULT NULL,
  `info` text,
  `info_1` text,
  `reason` text,
  `reason_1` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_right` (`access_level`,`ident`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

ALTER TABLE `user_rights` ADD INDEX `IDX_IDENT` (`ident`);
