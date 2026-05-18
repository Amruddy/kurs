import "server-only";

import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

type SaveTeacherGroupJournalInput = {
  email: string;
  formData: FormData;
  groupId: string;
  organizationId: string;
};

type TeacherUserRow = {
  id: string;
};

type TeacherGroupRow = {
  id: string;
  teacher_id: string | null;
};

type LessonIdRow = {
  id: string;
};

type GroupStudentStatusRow = {
  student_id: string;
  status: string;
};

type ExistingJournalEntryRow = {
  id: string;
  lesson_id: string;
  student_id: string;
};

type AttendanceMark = "absent" | "excused" | "present" | null;

type JournalSubmission = {
  attendanceMark: AttendanceMark;
  lessonId: string;
  studentId: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertWriteSuccess(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function assertUuid(value: string, context: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`${context}: неверный идентификатор.`);
  }
}

function parseAttendanceMark(value: string): AttendanceMark {
  if (value === "") {
    return null;
  }

  if (value === "present" || value === "absent" || value === "excused") {
    return value;
  }

  throw new Error("Журнал: неверная отметка посещаемости.");
}

function journalKey(lessonId: string, studentId: string) {
  return `${lessonId}:${studentId}`;
}

function parseJournalSubmissions(formData: FormData) {
  const submissions = new Map<string, JournalSubmission>();

  for (const [field, value] of formData.entries()) {
    if (!field.startsWith("attendance__")) {
      continue;
    }

    if (typeof value !== "string") {
      throw new Error("Журнал: неверное значение ячейки.");
    }

    const [, lessonId, studentId] = field.split("__");

    if (!lessonId || !studentId) {
      throw new Error("Журнал: неверная ячейка.");
    }

    assertUuid(lessonId, "Урок журнала");
    assertUuid(studentId, "Ученик журнала");

    submissions.set(journalKey(lessonId, studentId), {
      attendanceMark: parseAttendanceMark(value),
      lessonId,
      studentId,
    });
  }

  return [...submissions.values()];
}

export async function saveTeacherGroupJournal(input: SaveTeacherGroupJournalInput) {
  const submissions = parseJournalSubmissions(input.formData);
  const supabase = createSupabaseAdminClient();
  const teacherResult = await supabase.from("users").select("id").eq("email", input.email).maybeSingle();

  assertWriteSuccess(teacherResult.error, "Проверка преподавателя");

  const teacher = teacherResult.data as TeacherUserRow | null;

  if (!teacher) {
    throw new Error("Проверка преподавателя: пользователь не найден.");
  }

  const groupResult = await supabase
    .from("groups")
    .select("id,teacher_id")
    .eq("id", input.groupId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  assertWriteSuccess(groupResult.error, "Проверка группы журнала");

  const group = groupResult.data as TeacherGroupRow | null;

  if (!group || group.teacher_id !== teacher.id) {
    throw new Error("Журнал группы: группа не найдена.");
  }

  if (submissions.length === 0) {
    return 0;
  }

  const lessonIds = [...new Set(submissions.map((submission) => submission.lessonId))];
  const studentIds = [...new Set(submissions.map((submission) => submission.studentId))];
  const [lessonsResult, groupStudentsResult, existingEntriesResult] = await Promise.all([
    supabase
      .from("lessons")
      .select("id")
      .eq("organization_id", input.organizationId)
      .eq("group_id", input.groupId)
      .in("id", lessonIds),
    supabase.from("group_students").select("student_id,status").eq("group_id", input.groupId).in("student_id", studentIds),
    supabase.from("journal_entries").select("id,lesson_id,student_id").in("lesson_id", lessonIds).in("student_id", studentIds),
  ]);

  assertWriteSuccess(lessonsResult.error, "Проверка уроков журнала");
  assertWriteSuccess(groupStudentsResult.error, "Проверка учеников журнала");
  assertWriteSuccess(existingEntriesResult.error, "Проверка существующих отметок журнала");

  const validLessonIds = new Set(((lessonsResult.data ?? []) as LessonIdRow[]).map((lesson) => lesson.id));
  const validStudentIds = new Set(
    ((groupStudentsResult.data ?? []) as GroupStudentStatusRow[])
      .filter((student) => student.status === "active")
      .map((student) => student.student_id),
  );

  if (validLessonIds.size !== lessonIds.length) {
    throw new Error("Журнал группы: один из уроков не относится к этой группе.");
  }

  if (validStudentIds.size !== studentIds.length) {
    throw new Error("Журнал группы: один из учеников не входит в активный состав группы.");
  }

  const existingEntryKeys = new Set(
    ((existingEntriesResult.data ?? []) as ExistingJournalEntryRow[]).map((entry) =>
      journalKey(entry.lesson_id, entry.student_id),
    ),
  );
  const updatedAt = new Date().toISOString();
  const payload = submissions
    .filter((submission) => submission.attendanceMark !== null || existingEntryKeys.has(journalKey(submission.lessonId, submission.studentId)))
    .map((submission) => ({
      attendance_mark: submission.attendanceMark,
      lesson_id: submission.lessonId,
      student_id: submission.studentId,
      updated_at: updatedAt,
    }));

  if (payload.length === 0) {
    return 0;
  }

  const result = await supabase.from("journal_entries").upsert(payload, { onConflict: "lesson_id,student_id" });

  assertWriteSuccess(result.error, "Сохранение журнала группы");

  return payload.length;
}
