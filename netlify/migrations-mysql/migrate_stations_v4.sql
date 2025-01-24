ALTER TABLE `tracks_history` 
	ADD COLUMN `station_id` varchar(255) DEFAULT '' 
	AFTER `user_id`;
ALTER TABLE `tracks_history` 
	ADD KEY `idx_tracks_history_station_id` (`station_id`);
