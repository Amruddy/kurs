import "server-only";

import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

type CreateCourseInput = {
  organizationId: string;
  createdBy: string;
  name: string;
  description: string | null;
  format: string;
  lessonMarkScale: string;
};

type CreateStudentInput = {
  organizationId: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type CreateGroupInput = {
  organizationId: string;
  courseId: string;
  teacherId: string;
  name: string;
  status: string;
};

type AssignStudentToGroupInput = {
  groupId: string;
  studentId: string;
};

function assertWriteSuccess(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function createAdminCourse(input: CreateCourseInput) {
  const supabase = createSupabaseAdminClient();
  const courseResult = await supabase
    .from("courses")
    .insert({
      organization_id: input.organizationId,
      name: input.name,
      description: input.description,
      type: "tajweed",
      format: input.format,
      lesson_mark_scale: input.lessonMarkScale,
      status: "active",
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  assertWriteSuccess(courseResult.error, "Создание курса");

  if (!courseResult.data) {
    throw new Error("Создание курса: Supabase не вернул id курса.");
  }

  const settingsResult = await supabase.from("course_progress_settings").insert({
    course_id: courseResult.data.id,
    name: "Прогресс таджвида",
    is_progress_enabled: true,
  });

  assertWriteSuccess(settingsResult.error, "Настройки прогресса курса");
}

export async function createAdminStudent(input: CreateStudentInput) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from("students").insert({
    organization_id: input.organizationId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    status: "active",
  });

  assertWriteSuccess(result.error, "Создание ученика");
}

export async function createAdminGroup(input: CreateGroupInput) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from("groups").insert({
    organization_id: input.organizationId,
    course_id: input.courseId,
    teacher_id: input.teacherId,
    name: input.name,
    status: input.status,
  });

  assertWriteSuccess(result.error, "Создание группы");
}

export async function assignAdminStudentToGroup(input: AssignStudentToGroupInput) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.from("group_students").upsert(
    {
      group_id: input.groupId,
      student_id: input.studentId,
      status: "active",
      joined_at: new Date().toISOString().slice(0, 10),
      left_at: null,
    },
    { onConflict: "group_id,student_id" },
  );

  assertWriteSuccess(result.error, "Назначение ученика в группу");
}
