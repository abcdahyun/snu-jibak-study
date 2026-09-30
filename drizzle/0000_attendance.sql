CREATE TABLE `attendance` (
  `participant_id` text NOT NULL,
  `date` text NOT NULL,
  PRIMARY KEY(`participant_id`, `date`)
);
