-- CreateEnum
CREATE TYPE "ProgressLevel" AS ENUM ('excellent', 'good', 'satisfactory', 'poor');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('text', 'link');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('active', 'archived');

-- CreateTable
CREATE TABLE "progress_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT,
    "lesson_id" TEXT,
    "teacher_id" TEXT NOT NULL,
    "repeat_text" TEXT,
    "student_comment" TEXT,
    "internal_comment" TEXT,
    "show_rules" BOOLEAN NOT NULL DEFAULT true,
    "show_errors" BOOLEAN NOT NULL DEFAULT true,
    "show_repeat_text" BOOLEAN NOT NULL DEFAULT true,
    "show_student_comment" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_progress_rules" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT,
    "name" TEXT NOT NULL,
    "level" "ProgressLevel",
    "note" TEXT,
    "is_visible_to_student" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_progress_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_progress_errors" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "is_repeated" BOOLEAN NOT NULL DEFAULT false,
    "is_visible_to_student" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_progress_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homeworks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "group_id" TEXT,
    "lesson_id" TEXT,
    "student_id" TEXT,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "due_at" DATE,
    "is_visible_to_student" BOOLEAN NOT NULL DEFAULT true,
    "status" "HomeworkStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "course_id" TEXT,
    "group_id" TEXT,
    "lesson_id" TEXT,
    "homework_id" TEXT,
    "student_id" TEXT,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "description" TEXT,
    "is_visible_to_student" BOOLEAN NOT NULL DEFAULT true,
    "status" "MaterialStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "progress_records_organization_id_idx" ON "progress_records"("organization_id");

-- CreateIndex
CREATE INDEX "progress_records_student_id_idx" ON "progress_records"("student_id");

-- CreateIndex
CREATE INDEX "progress_records_lesson_id_idx" ON "progress_records"("lesson_id");

-- CreateIndex
CREATE INDEX "student_progress_rules_organization_id_idx" ON "student_progress_rules"("organization_id");

-- CreateIndex
CREATE INDEX "student_progress_rules_student_id_idx" ON "student_progress_rules"("student_id");

-- CreateIndex
CREATE INDEX "student_progress_errors_organization_id_idx" ON "student_progress_errors"("organization_id");

-- CreateIndex
CREATE INDEX "student_progress_errors_student_id_idx" ON "student_progress_errors"("student_id");

-- CreateIndex
CREATE INDEX "homeworks_organization_id_idx" ON "homeworks"("organization_id");

-- CreateIndex
CREATE INDEX "homeworks_group_id_idx" ON "homeworks"("group_id");

-- CreateIndex
CREATE INDEX "homeworks_student_id_idx" ON "homeworks"("student_id");

-- CreateIndex
CREATE INDEX "homeworks_lesson_id_idx" ON "homeworks"("lesson_id");

-- CreateIndex
CREATE INDEX "materials_organization_id_idx" ON "materials"("organization_id");

-- CreateIndex
CREATE INDEX "materials_course_id_idx" ON "materials"("course_id");

-- CreateIndex
CREATE INDEX "materials_group_id_idx" ON "materials"("group_id");

-- CreateIndex
CREATE INDEX "materials_student_id_idx" ON "materials"("student_id");

-- CreateIndex
CREATE INDEX "materials_lesson_id_idx" ON "materials"("lesson_id");

-- CreateIndex
CREATE INDEX "materials_homework_id_idx" ON "materials"("homework_id");

-- AddForeignKey
ALTER TABLE "progress_records" ADD CONSTRAINT "progress_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_records" ADD CONSTRAINT "progress_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_records" ADD CONSTRAINT "progress_records_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_records" ADD CONSTRAINT "progress_records_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_records" ADD CONSTRAINT "progress_records_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress_rules" ADD CONSTRAINT "student_progress_rules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress_rules" ADD CONSTRAINT "student_progress_rules_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress_rules" ADD CONSTRAINT "student_progress_rules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress_errors" ADD CONSTRAINT "student_progress_errors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress_errors" ADD CONSTRAINT "student_progress_errors_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_progress_errors" ADD CONSTRAINT "student_progress_errors_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homeworks" ADD CONSTRAINT "homeworks_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
