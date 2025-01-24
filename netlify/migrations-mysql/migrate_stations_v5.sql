ALTER TABLE `user_tracks` 
	ADD COLUMN `station_id` varchar(255) DEFAULT '' 
	AFTER `user_id`;
ALTER TABLE `user_tracks` 
	ADD KEY `idx_user_tracks_station_id` (`station_id`);
