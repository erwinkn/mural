CREATE TABLE `kv` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`language_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`title` text NOT NULL,
	`payload` text NOT NULL
);
