-- CreateEnum
CREATE TYPE "ScheduleTargetType" AS ENUM ('group', 'individual_enrollment');

-- CreateEnum
CREATE TYPE "ScheduleRuleStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'moved');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('not_checked', 'confirmed');

-- CreateTable
CREATE TABLE "schedule_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "target_type" "ScheduleTargetType" NOT NULL DEFAULT 'group',
    "target_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "starts_on" DATE NOT NULL,
    "ends_on" DATE,
    "status" "ScheduleRuleStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "group_id" TEXT,
    "teacher_id" TEXT NOT NULL,
    "schedule_rule_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "topic" TEXT,
    "summary" TEXT,
    "lesson_status" "LessonStatus" NOT NULL DEFAULT 'scheduled',
    "attendance_status" "AttendanceStatus" NOT NULL DEFAULT 'not_checked',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_rules_organization_id_idx" ON "schedule_rules"("organization_id");

-- CreateIndex
CREATE INDEX "schedule_rules_target_type_target_id_idx" ON "schedule_rules"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "lessons_organization_id_idx" ON "lessons"("organization_id");

-- CreateIndex
CREATE INDEX "lessons_course_id_idx" ON "lessons"("course_id");

-- CreateIndex
CREATE INDEX "lessons_group_id_idx" ON "lessons"("group_id");

-- CreateIndex
CREATE INDEX "lessons_teacher_id_idx" ON "lessons"("teacher_id");

-- CreateIndex
CREATE INDEX "lessons_starts_at_idx" ON "lessons"("starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_organization_id_schedule_rule_id_starts_at_key" ON "lessons"("organization_id", "schedule_rule_id", "starts_at");

-- AddForeignKey
ALTER TABLE "schedule_rules" ADD CONSTRAINT "schedule_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_schedule_rule_id_fkey" FOREIGN KEY ("schedule_rule_id") REFERENCES "schedule_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
