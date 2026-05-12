-- Drop the separate attendance confirmation state. Completion of the lesson is
-- the only signal that empty journal cells can be counted as presence.
ALTER TABLE "lessons" DROP COLUMN "attendance_status";

DROP TYPE "AttendanceStatus";
