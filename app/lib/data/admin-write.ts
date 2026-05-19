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

type UpdateCourseInput = {
  organizationId: string;
  courseId: string;
  name: string;
  description: string | null;
  format: string;
  lessonMarkScale: string;
  status: string;
};

type CreateTeacherInput = {
  organizationId: string;
  name: string;
  email: string;
  phone: string | null;
};

type UpdateStudentInput = {
  organizationId: string;
  studentId: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
};

type CreateGroupInput = {
  organizationId: string;
  courseId: string;
  teacherId: string;
  name: string;
  status: string;
};

type UpdateGroupInput = {
  organizationId: string;
  groupId: string;
  teacherId: string | null;
  name: string;
  status: string;
};

type AssignStudentToGroupInput = {
  organizationId: string;
  groupId: string;
  studentId: string;
};

type RemoveStudentFromGroupInput = {
  organizationId: string;
  groupId: string;
  groupStudentId: string;
};

type CreateScheduleRuleInput = {
  organizationId: string;
  groupId: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  startsOn: string;
  endsOn: string | null;
};

type DeleteScheduleRuleInput = {
  organizationId: string;
  groupId: string;
  scheduleRuleId: string;
};

export type LessonGenerationHorizon = "one_month" | "three_months" | "schedule_end";

type GenerateGroupLessonsInput = {
  organizationId: string;
  groupId: string;
  horizon: LessonGenerationHorizon;
};

type GroupForLessonGeneration = {
  id: string;
  course_id: string;
  teacher_id: string | null;
};

type ScheduleRuleForGeneration = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  starts_on: string;
  ends_on: string | null;
};

type ExistingLessonSlot = {
  schedule_rule_id: string | null;
  starts_at: string;
};

type LessonIdRow = {
  id: string;
};

type OrganizationMemberRoleRow = {
  roles: unknown;
  status: string | null;
};

function assertWriteSuccess(error: { message: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function assertAllowedValue(value: string, allowed: string[], label: string) {
  if (!allowed.includes(value)) {
    throw new Error(`${label}: неверное значение.`);
  }
}

function assertDateString(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label}: неверная дата.`);
  }
}

function assertTimeString(value: string, label: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${label}: неверное время.`);
  }
}

async function assertCourseInOrganization(
  client: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  courseId: string,
) {
  const courseResult = await client
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  assertWriteSuccess(courseResult.error, "Проверка курса");

  if (!courseResult.data) {
    throw new Error("Группа: выбранный курс не найден в текущей организации.");
  }
}

async function assertTeacherInOrganization(
  client: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  teacherId: string,
) {
  const teacherResult = await client
    .from("organization_members")
    .select("roles,status")
    .eq("organization_id", organizationId)
    .eq("user_id", teacherId)
    .maybeSingle();

  assertWriteSuccess(teacherResult.error, "Проверка преподавателя");

  const teacher = teacherResult.data as OrganizationMemberRoleRow | null;
  const roles = Array.isArray(teacher?.roles) ? teacher.roles : [];

  if (!teacher || teacher.status !== "active" || !roles.includes("teacher")) {
    throw new Error("Группа: выбранный преподаватель не найден в текущей организации.");
  }
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function moscowDateOnly(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Moscow",
    year: "numeric",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

function maxDateString(left: string, right: string) {
  return left > right ? left : right;
}

function minDateString(left: string, right: string) {
  return left < right ? left : right;
}

function moscowDateTimeIso(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`).toISOString();
}

function datesInWindow(startDate: string, endDate: string, weekday: number) {
  const dates: string[] = [];
  let current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current.getUTCDay() !== weekday && current <= end) {
    current = addDays(current, 1);
  }

  while (current <= end) {
    dates.push(dateOnly(current));
    current = addDays(current, 7);
  }

  return dates;
}

function resolveLessonGenerationEndDate(
  horizon: LessonGenerationHorizon,
  today: string,
  rules: ScheduleRuleForGeneration[],
) {
  if (horizon === "one_month") {
    return dateOnly(addMonths(new Date(`${today}T00:00:00Z`), 1));
  }

  if (horizon === "three_months") {
    return dateOnly(addMonths(new Date(`${today}T00:00:00Z`), 3));
  }

  const missingEndDate = rules.some((rule) => !rule.ends_on);

  if (missingEndDate) {
    throw new Error("Создание занятий: для создания до окончания расписания заполните дату окончания у всех активных правил.");
  }

  return rules.reduce((latest, rule) => maxDateString(latest, rule.ends_on as string), today);
}

function assertWeekdays(weekdays: number[]) {
  if (weekdays.length === 0) {
    throw new Error("Дни недели: выберите хотя бы один день.");
  }

  const uniqueWeekdays = new Set(weekdays);

  if (uniqueWeekdays.size !== weekdays.length) {
    throw new Error("Дни недели: один день не должен повторяться.");
  }

  for (const weekday of weekdays) {
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      throw new Error("День недели: неверное значение.");
    }
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

export async function updateAdminCourse(input: UpdateCourseInput) {
  assertAllowedValue(input.format, ["group", "individual", "both"], "Формат курса");
  assertAllowedValue(input.lessonMarkScale, ["five_point", "ten_point"], "Шкала оценок");
  assertAllowedValue(input.status, ["active", "archived"], "Статус курса");

  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("courses")
    .update({
      archived_at: input.status === "archived" ? new Date().toISOString() : null,
      description: input.description,
      format: input.format,
      lesson_mark_scale: input.lessonMarkScale,
      name: input.name,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.courseId)
    .eq("organization_id", input.organizationId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Изменение курса");

  if (!result.data) {
    throw new Error("Изменение курса: курс не найден.");
  }
}

export async function archiveAdminCourse(input: { organizationId: string; courseId: string }) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("courses")
    .update({
      archived_at: new Date().toISOString(),
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.courseId)
    .eq("organization_id", input.organizationId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Архивация курса");

  if (!result.data) {
    throw new Error("Архивация курса: курс не найден.");
  }
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

export async function updateAdminStudent(input: UpdateStudentInput) {
  assertAllowedValue(input.status, ["active", "paused", "archived"], "Статус ученика");

  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("students")
    .update({
      archived_at: input.status === "archived" ? new Date().toISOString() : null,
      email: input.email,
      name: input.name,
      phone: input.phone,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.studentId)
    .eq("organization_id", input.organizationId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Изменение ученика");

  if (!result.data) {
    throw new Error("Изменение ученика: ученик не найден.");
  }
}

export async function archiveAdminStudent(input: { organizationId: string; studentId: string }) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("students")
    .update({
      archived_at: new Date().toISOString(),
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.studentId)
    .eq("organization_id", input.organizationId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Архивация ученика");

  if (!result.data) {
    throw new Error("Архивация ученика: ученик не найден.");
  }
}

export async function createAdminTeacher(input: CreateTeacherInput) {
  const supabase = createSupabaseAdminClient();
  const existingUserResult = await supabase.from("users").select("id").eq("email", input.email).maybeSingle();

  assertWriteSuccess(existingUserResult.error, "Проверка преподавателя");

  let userId = existingUserResult.data?.id as string | undefined;

  if (userId) {
    const updateUserResult = await supabase
      .from("users")
      .update({
        name: input.name,
        phone: input.phone,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    assertWriteSuccess(updateUserResult.error, "Обновление преподавателя");
  } else {
    const createUserResult = await supabase
      .from("users")
      .insert({
        email: input.email,
        name: input.name,
        phone: input.phone,
        status: "active",
      })
      .select("id")
      .single();

    assertWriteSuccess(createUserResult.error, "Создание преподавателя");

    if (!createUserResult.data) {
      throw new Error("Создание преподавателя: Supabase не вернул id пользователя.");
    }

    userId = createUserResult.data.id;
  }

  const existingMemberResult = await supabase
    .from("organization_members")
    .select("roles,permissions")
    .eq("organization_id", input.organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  assertWriteSuccess(existingMemberResult.error, "Проверка роли преподавателя");

  const existingRoles = Array.isArray(existingMemberResult.data?.roles) ? existingMemberResult.data.roles : [];
  const existingPermissions = Array.isArray(existingMemberResult.data?.permissions)
    ? existingMemberResult.data.permissions
    : [];
  const roles = existingRoles.includes("teacher") ? existingRoles : [...existingRoles, "teacher"];

  const memberResult = await supabase.from("organization_members").upsert(
    {
      organization_id: input.organizationId,
      permissions: existingPermissions,
      roles,
      status: "active",
      updated_at: new Date().toISOString(),
      user_id: userId,
    },
    { onConflict: "organization_id,user_id" },
  );

  assertWriteSuccess(memberResult.error, "Роль преподавателя");
}

export async function createAdminGroup(input: CreateGroupInput) {
  assertAllowedValue(input.status, ["recruiting", "active", "paused", "completed", "archived"], "Статус группы");

  const supabase = createSupabaseAdminClient();
  await Promise.all([
    assertCourseInOrganization(supabase, input.organizationId, input.courseId),
    assertTeacherInOrganization(supabase, input.organizationId, input.teacherId),
  ]);

  const result = await supabase.from("groups").insert({
    organization_id: input.organizationId,
    course_id: input.courseId,
    teacher_id: input.teacherId,
    name: input.name,
    status: input.status,
  });

  assertWriteSuccess(result.error, "Создание группы");
}

export async function updateAdminGroup(input: UpdateGroupInput) {
  assertAllowedValue(input.status, ["recruiting", "active", "paused", "completed", "archived"], "Статус группы");

  const supabase = createSupabaseAdminClient();

  if (input.teacherId) {
    await assertTeacherInOrganization(supabase, input.organizationId, input.teacherId);
  }

  const result = await supabase
    .from("groups")
    .update({
      teacher_id: input.teacherId,
      name: input.name,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.groupId)
    .eq("organization_id", input.organizationId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Изменение группы");

  if (!result.data) {
    throw new Error("Изменение группы: группа не найдена.");
  }
}

export async function assignAdminStudentToGroup(input: AssignStudentToGroupInput) {
  const supabase = createSupabaseAdminClient();
  const [groupResult, studentResult] = await Promise.all([
    supabase
      .from("groups")
      .select("id")
      .eq("id", input.groupId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    supabase
      .from("students")
      .select("id")
      .eq("id", input.studentId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
  ]);

  assertWriteSuccess(groupResult.error, "Проверка группы");
  assertWriteSuccess(studentResult.error, "Проверка ученика");

  if (!groupResult.data || !studentResult.data) {
    throw new Error("Назначение ученика в группу: группа или ученик не найдены в текущей организации.");
  }

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

export async function removeAdminStudentFromGroup(input: RemoveStudentFromGroupInput) {
  const supabase = createSupabaseAdminClient();
  const groupResult = await supabase
    .from("groups")
    .select("id")
    .eq("id", input.groupId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  assertWriteSuccess(groupResult.error, "Проверка группы");

  if (!groupResult.data) {
    throw new Error("Удаление ученика из группы: группа не найдена.");
  }

  const result = await supabase
    .from("group_students")
    .update({
      left_at: new Date().toISOString().slice(0, 10),
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.groupStudentId)
    .eq("group_id", input.groupId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Удаление ученика из группы");

  if (!result.data) {
    throw new Error("Удаление ученика из группы: связь не найдена.");
  }
}

export async function createAdminGroupScheduleRule(input: CreateScheduleRuleInput) {
  assertWeekdays(input.weekdays);
  assertDateString(input.startsOn, "Дата начала");
  assertTimeString(input.startTime, "Время начала");
  assertTimeString(input.endTime, "Время окончания");

  if (input.endsOn) {
    assertDateString(input.endsOn, "Дата окончания");

    if (input.endsOn < input.startsOn) {
      throw new Error("Дата окончания не может быть раньше даты начала.");
    }
  }

  if (input.endTime <= input.startTime) {
    throw new Error("Время окончания должно быть позже времени начала.");
  }

  const supabase = createSupabaseAdminClient();
  const groupResult = await supabase
    .from("groups")
    .select("id")
    .eq("id", input.groupId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  assertWriteSuccess(groupResult.error, "Проверка группы");

  if (!groupResult.data) {
    throw new Error("Расписание: группа не найдена.");
  }

  const result = await supabase.from("schedule_rules").insert(
    input.weekdays.map((weekday) => ({
      organization_id: input.organizationId,
      target_type: "group",
      target_id: input.groupId,
      weekday,
      start_time: input.startTime,
      end_time: input.endTime,
      timezone: "Europe/Moscow",
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      status: "active",
    })),
  );

  assertWriteSuccess(result.error, "Создание расписания");
}

export async function deleteAdminGroupScheduleRule(input: DeleteScheduleRuleInput) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const lessonsResult = await supabase
    .from("lessons")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("group_id", input.groupId)
    .eq("schedule_rule_id", input.scheduleRuleId)
    .gte("starts_at", now);

  assertWriteSuccess(lessonsResult.error, "Проверка будущих уроков расписания");

  const futureLessonIds = ((lessonsResult.data ?? []) as LessonIdRow[]).map((lesson) => lesson.id);

  if (futureLessonIds.length > 0) {
    const journalResult = await supabase
      .from("journal_entries")
      .select("id")
      .in("lesson_id", futureLessonIds)
      .limit(1);

    assertWriteSuccess(journalResult.error, "Проверка журнала расписания");

    if ((journalResult.data ?? []).length > 0) {
      throw new Error("Удаление расписания: у будущих уроков уже есть записи журнала.");
    }

    const lessonsDeleteResult = await supabase
      .from("lessons")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("group_id", input.groupId)
      .eq("schedule_rule_id", input.scheduleRuleId)
      .gte("starts_at", now);

    assertWriteSuccess(lessonsDeleteResult.error, "Удаление будущих уроков расписания");
  }

  const result = await supabase
    .from("schedule_rules")
    .delete()
    .eq("id", input.scheduleRuleId)
    .eq("organization_id", input.organizationId)
    .eq("target_type", "group")
    .eq("target_id", input.groupId)
    .select("id")
    .maybeSingle();

  assertWriteSuccess(result.error, "Удаление расписания");

  if (!result.data) {
    throw new Error("Удаление расписания: правило не найдено.");
  }
}

export async function generateAdminGroupLessons(input: GenerateGroupLessonsInput) {
  const supabase = createSupabaseAdminClient();
  const groupResult = await supabase
    .from("groups")
    .select("id,course_id,teacher_id")
    .eq("id", input.groupId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  assertWriteSuccess(groupResult.error, "Проверка группы");

  const group = groupResult.data as GroupForLessonGeneration | null;

  if (!group) {
    throw new Error("Создание занятий: группа не найдена.");
  }

  if (!group.teacher_id) {
    throw new Error("Создание занятий: у группы нет преподавателя.");
  }

  const rulesResult = await supabase
    .from("schedule_rules")
    .select("id,weekday,start_time,end_time,starts_on,ends_on")
    .eq("organization_id", input.organizationId)
    .eq("target_type", "group")
    .eq("target_id", input.groupId)
    .eq("status", "active");

  assertWriteSuccess(rulesResult.error, "Расписание группы");

  const rules = (rulesResult.data ?? []) as ScheduleRuleForGeneration[];

  if (rules.length === 0) {
    throw new Error("Создание занятий: сначала настройте расписание.");
  }

  const today = moscowDateOnly(new Date());
  const windowEnd = resolveLessonGenerationEndDate(input.horizon, today, rules);
  const existingResult = await supabase
    .from("lessons")
    .select("schedule_rule_id,starts_at")
    .eq("organization_id", input.organizationId)
    .eq("group_id", input.groupId)
    .gte("starts_at", moscowDateTimeIso(today, "00:00"))
    .lte("starts_at", moscowDateTimeIso(windowEnd, "23:59"));

  assertWriteSuccess(existingResult.error, "Проверка занятий");

  const existingSlots = new Set(
    ((existingResult.data ?? []) as ExistingLessonSlot[])
      .filter((lesson) => lesson.schedule_rule_id)
      .map((lesson) => `${lesson.schedule_rule_id}:${new Date(lesson.starts_at).toISOString()}`),
  );
  const lessonsToCreate = rules.flatMap((rule) => {
    const startDate = maxDateString(today, rule.starts_on);
    const endDate = rule.ends_on ? minDateString(windowEnd, rule.ends_on) : windowEnd;

    if (startDate > endDate) {
      return [];
    }

    return datesInWindow(startDate, endDate, rule.weekday)
      .map((scheduledAt) => ({
        organization_id: input.organizationId,
        course_id: group.course_id,
        group_id: group.id,
        individual_enrollment_id: null,
        teacher_id: group.teacher_id,
        schedule_rule_id: rule.id,
        scheduled_at: scheduledAt,
        starts_at: moscowDateTimeIso(scheduledAt, rule.start_time.slice(0, 5)),
        ends_at: moscowDateTimeIso(scheduledAt, rule.end_time.slice(0, 5)),
        topic: null,
        summary: "Создано по расписанию",
      }))
      .filter((lesson) => !existingSlots.has(`${lesson.schedule_rule_id}:${lesson.starts_at}`));
  });

  if (lessonsToCreate.length === 0) {
    return 0;
  }

  const insertResult = await supabase.from("lessons").insert(lessonsToCreate);

  assertWriteSuccess(insertResult.error, "Создание занятий");

  return lessonsToCreate.length;
}
