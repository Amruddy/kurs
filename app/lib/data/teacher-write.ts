import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/app/lib/supabase/server";

type SaveTeacherGroupJournalInput = {
  email: string;
  formData: FormData;
  groupId: string;
  organizationId: string;
};

type SaveTeacherLessonInput = {
  email: string;
  formData: FormData;
  lessonId: string;
  organizationId: string;
};

type TeacherUserRow = {
  id: string;
};

type TeacherGroupRow = {
  id: string;
  teacher_id: string | null;
};

type TeacherLessonGroupRow = {
  course_id: string;
  id: string;
  teacher_id: string | null;
};

type TeacherLessonRow = {
  course_id: string;
  group_id: string | null;
  id: string;
  teacher_id: string;
};

type TeacherCourseRow = {
  id: string;
  lesson_mark_scale: string | null;
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

type ExistingLessonJournalEntryRow = {
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

type TeacherLessonContext = {
  course: TeacherCourseRow;
  group: TeacherLessonGroupRow;
  lesson: TeacherLessonRow;
  teacher: TeacherUserRow;
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

function formText(formData: FormData, name: string, label: string) {
  const value = formData.get(name);

  if (value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new Error(`${label}: неверное значение.`);
  }

  return value.trim();
}

function nullableText(formData: FormData, name: string, label: string) {
  const value = formText(formData, name, label);

  return value.length > 0 ? value : null;
}

function requiredText(formData: FormData, name: string, label: string) {
  const value = formText(formData, name, label);

  if (value.length === 0) {
    throw new Error(`${label}: обязательное поле.`);
  }

  return value;
}

function parseCheckbox(formData: FormData, name: string, label: string) {
  const value = formData.get(name);

  if (value === null) {
    return false;
  }

  if (typeof value !== "string") {
    throw new Error(`${label}: неверное значение.`);
  }

  return value === "true" || value === "on";
}

function lessonMarkValuesForScale(scale: string | null | undefined) {
  if (scale === "five_point") {
    return new Set(["1", "2", "3", "4", "5"]);
  }

  if (scale === "ten_point") {
    return new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
  }

  return new Set<string>();
}

function parseLessonMark(value: string, scale: string | null | undefined) {
  if (value.length === 0) {
    return null;
  }

  const allowedValues = lessonMarkValuesForScale(scale);

  if (!allowedValues.has(value)) {
    throw new Error("Оценка за урок: неверное значение.");
  }

  return value;
}

function parseMaterialType(value: string) {
  if (value === "text" || value === "link") {
    return value;
  }

  throw new Error("Материал: неверный тип.");
}

function parseVisibility(value: string) {
  if (value === "teacher_only" || value === "visible_to_students") {
    return value;
  }

  throw new Error("Материал: неверная видимость.");
}

function parseDueAt(formData: FormData) {
  const value = formText(formData, "due_date", "Срок домашнего задания");

  if (value.length === 0) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Срок домашнего задания: неверная дата.");
  }

  return new Date(`${value}T00:00:00+03:00`).toISOString();
}

async function getTeacherByEmail(supabase: SupabaseClient, email: string) {
  const teacherResult = await supabase.from("users").select("id").eq("email", email).maybeSingle();

  assertWriteSuccess(teacherResult.error, "Проверка преподавателя");

  const teacher = teacherResult.data as TeacherUserRow | null;

  if (!teacher) {
    throw new Error("Проверка преподавателя: пользователь не найден.");
  }

  return teacher;
}

async function getTeacherLessonContext(supabase: SupabaseClient, input: SaveTeacherLessonInput): Promise<TeacherLessonContext> {
  assertUuid(input.lessonId, "Урок");

  const teacher = await getTeacherByEmail(supabase, input.email);
  const lessonResult = await supabase
    .from("lessons")
    .select("id,course_id,group_id,teacher_id")
    .eq("id", input.lessonId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  assertWriteSuccess(lessonResult.error, "Проверка урока");

  const lesson = lessonResult.data as TeacherLessonRow | null;

  if (!lesson || lesson.teacher_id !== teacher.id || !lesson.group_id) {
    throw new Error("Урок: запись не найдена.");
  }

  const [groupResult, courseResult] = await Promise.all([
    supabase
      .from("groups")
      .select("id,course_id,teacher_id")
      .eq("id", lesson.group_id)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    supabase
      .from("courses")
      .select("id,lesson_mark_scale")
      .eq("id", lesson.course_id)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
  ]);

  assertWriteSuccess(groupResult.error, "Проверка группы урока");
  assertWriteSuccess(courseResult.error, "Проверка курса урока");

  const group = groupResult.data as TeacherLessonGroupRow | null;
  const course = courseResult.data as TeacherCourseRow | null;

  if (!group || group.teacher_id !== teacher.id || group.course_id !== lesson.course_id || !course) {
    throw new Error("Урок: запись не найдена.");
  }

  return { course, group, lesson, teacher };
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

export async function saveTeacherLessonDetails(input: SaveTeacherLessonInput) {
  const supabase = createSupabaseAdminClient();
  const context = await getTeacherLessonContext(supabase, input);
  const result = await supabase
    .from("lessons")
    .update({
      summary: nullableText(input.formData, "summary", "Комментарий урока"),
      topic: nullableText(input.formData, "topic", "Тема урока"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", context.lesson.id)
    .eq("organization_id", input.organizationId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Сохранение урока");

  if (!result.data) {
    throw new Error("Сохранение урока: запись не найдена.");
  }

  return { groupId: context.group.id };
}

export async function saveTeacherLessonJournal(input: SaveTeacherLessonInput) {
  const supabase = createSupabaseAdminClient();
  const context = await getTeacherLessonContext(supabase, input);
  const groupStudentsResult = await supabase
    .from("group_students")
    .select("student_id,status")
    .eq("group_id", context.group.id);

  assertWriteSuccess(groupStudentsResult.error, "Проверка учеников урока");

  const activeGroupStudents = ((groupStudentsResult.data ?? []) as GroupStudentStatusRow[]).filter(
    (student) => student.status === "active",
  );
  const activeStudentIds = activeGroupStudents.map((student) => student.student_id);

  if (activeStudentIds.length === 0) {
    return { count: 0, groupId: context.group.id };
  }

  const existingEntriesResult = await supabase
    .from("journal_entries")
    .select("id,lesson_id,student_id")
    .eq("lesson_id", context.lesson.id)
    .in("student_id", activeStudentIds);

  assertWriteSuccess(existingEntriesResult.error, "Проверка существующих записей урока");

  const existingEntryKeys = new Set(
    ((existingEntriesResult.data ?? []) as ExistingLessonJournalEntryRow[]).map((entry) =>
      journalKey(entry.lesson_id, entry.student_id),
    ),
  );
  const updatedAt = new Date().toISOString();
  const payload = activeStudentIds
    .map((studentId) => {
      const attendanceMark = parseAttendanceMark(formText(input.formData, `attendance__${studentId}`, "Посещаемость"));
      const lessonMark = parseLessonMark(
        formText(input.formData, `lesson_mark__${studentId}`, "Оценка за урок"),
        context.course.lesson_mark_scale,
      );
      const teacherComment = nullableText(input.formData, `teacher_comment__${studentId}`, "Комментарий ученику");
      const internalComment = nullableText(input.formData, `internal_comment__${studentId}`, "Внутренний комментарий");
      const isVisibleToStudent = parseCheckbox(input.formData, `visible__${studentId}`, "Видимость комментария");
      const key = journalKey(context.lesson.id, studentId);
      const hasValue =
        attendanceMark !== null ||
        lessonMark !== null ||
        teacherComment !== null ||
        internalComment !== null ||
        isVisibleToStudent;

      if (!hasValue && !existingEntryKeys.has(key)) {
        return null;
      }

      return {
        attendance_mark: attendanceMark,
        internal_comment: internalComment,
        is_visible_to_student: isVisibleToStudent,
        lesson_id: context.lesson.id,
        lesson_mark: lessonMark,
        student_id: studentId,
        teacher_comment: teacherComment,
        updated_at: updatedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (payload.length === 0) {
    return { count: 0, groupId: context.group.id };
  }

  const result = await supabase.from("journal_entries").upsert(payload, { onConflict: "lesson_id,student_id" });

  assertWriteSuccess(result.error, "Сохранение журнала урока");

  return { count: payload.length, groupId: context.group.id };
}

export async function createTeacherLessonHomework(input: SaveTeacherLessonInput) {
  const supabase = createSupabaseAdminClient();
  const context = await getTeacherLessonContext(supabase, input);
  const result = await supabase.from("homework").insert({
    course_id: context.lesson.course_id,
    created_by: context.teacher.id,
    description: requiredText(input.formData, "description", "Описание домашнего задания"),
    due_at: parseDueAt(input.formData),
    group_id: context.group.id,
    lesson_id: context.lesson.id,
    organization_id: input.organizationId,
    status: "active",
    title: requiredText(input.formData, "title", "Название домашнего задания"),
  });

  assertWriteSuccess(result.error, "Добавление домашнего задания");

  return { groupId: context.group.id };
}

export async function createTeacherLessonMaterial(input: SaveTeacherLessonInput) {
  const supabase = createSupabaseAdminClient();
  const context = await getTeacherLessonContext(supabase, input);
  const type = parseMaterialType(requiredText(input.formData, "type", "Тип материала"));
  const visibility = parseVisibility(requiredText(input.formData, "visibility", "Видимость материала"));
  const content =
    type === "text"
      ? requiredText(input.formData, "content", "Текст материала")
      : nullableText(input.formData, "content", "Текст материала");
  const url = type === "link" ? requiredText(input.formData, "url", "Ссылка материала") : null;
  const result = await supabase.from("materials").insert({
    content,
    course_id: context.lesson.course_id,
    created_by: context.teacher.id,
    group_id: context.group.id,
    lesson_id: context.lesson.id,
    organization_id: input.organizationId,
    status: "active",
    title: requiredText(input.formData, "title", "Название материала"),
    type,
    url,
    visibility,
  });

  assertWriteSuccess(result.error, "Добавление материала");

  return { groupId: context.group.id };
}
