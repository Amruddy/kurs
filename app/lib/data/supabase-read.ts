import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient, SupabaseServerConfigError } from "@/app/lib/supabase/server";

export type DataResult<T> =
  | {
      state: "ready";
      data: T;
    }
  | {
      state: "setup";
      missingEnv: string[];
    }
  | {
      state: "error";
      message: string;
    };

type QueryRowsResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type QuerySingleResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type OrganizationRow = {
  id: string;
  name: string;
  timezone: string | null;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type MemberRow = {
  id: string;
  user_id: string;
  roles: string[];
  permissions: string[];
};

type CourseRow = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  format: string;
  status: string;
};

type GroupRow = {
  id: string;
  course_id: string;
  teacher_id: string | null;
  name: string;
  status: string;
};

type GroupStudentRow = {
  id: string;
  group_id: string;
  student_id: string;
  status: string;
};

type StudentRow = {
  id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
};

type LessonRow = {
  id: string;
  course_id: string;
  group_id: string | null;
  teacher_id: string;
  starts_at: string;
  ends_at: string;
  topic: string | null;
};

type ScheduleRuleRow = {
  id: string;
  target_type: string;
  target_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  starts_on: string;
  ends_on: string | null;
  status: string;
};

type HomeworkRow = {
  id: string;
  course_id: string;
  group_id: string | null;
  student_id: string | null;
  lesson_id?: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string;
};

type MaterialRow = {
  id: string;
  course_id: string | null;
  group_id: string | null;
  student_id: string | null;
  lesson_id?: string | null;
  homework_id?: string | null;
  title: string;
  type: string;
  content: string | null;
  url: string | null;
  visibility: string;
  status: string;
};

type JournalEntryRow = {
  id: string;
  lesson_id: string;
  student_id: string;
  attendance_mark: string | null;
  lesson_mark: string | null;
  teacher_comment: string | null;
  internal_comment: string | null;
  is_visible_to_student: boolean;
};

type ProgressRecordLessonRow = {
  id: string;
  lesson_id: string | null;
  student_id: string;
};

type PaymentRow = {
  id: string;
  student_id: string;
  course_id: string | null;
  group_id: string | null;
  amount: number;
  currency: string;
  period_start: string | null;
  period_end: string | null;
  due_at: string | null;
  status: string;
};

type ProgressRuleRow = {
  id: string;
  student_id: string;
  course_id: string;
  name: string;
  level: string | null;
  note: string | null;
  is_visible_to_student: boolean;
  is_active: boolean;
};

export type MetricItem = {
  label: string;
  value: string;
  detail?: string;
};

export type LessonSummary = {
  id: string;
  title: string;
  subtitle: string;
  when: string;
};

export type PaymentSummary = {
  id: string;
  studentName: string;
  context: string;
  amount: string;
  due: string;
  status: string;
};

export type AdminOverviewData = {
  organizationName: string;
  metrics: MetricItem[];
  upcomingLessons: LessonSummary[];
  duePayments: PaymentSummary[];
};

export type AdminCourseItem = {
  id: string;
  name: string;
  description: string;
  format: string;
  status: string;
  groupCount: string;
};

export type AdminGroupItem = {
  id: string;
  name: string;
  course: string;
  teacher: string;
  status: string;
  students: string;
  nextLesson: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type AdminGroupsData = {
  groups: AdminGroupItem[];
  courseOptions: SelectOption[];
  groupOptions: SelectOption[];
  studentOptions: SelectOption[];
  teacherOptions: SelectOption[];
};

export type AdminGroupDetailStudent = {
  id: string;
  groupStudentId: string;
  name: string;
  contacts: string;
  joinedAt: string;
  status: string;
};

export type AdminGroupScheduleRule = {
  id: string;
  weekday: string;
  timeRange: string;
  period: string;
};

export type ProblemSignal = {
  detail: string;
  label: string;
  tone: "danger" | "ok" | "warning";
};

export type AdminGroupDetailData = {
  id: string;
  name: string;
  course: string;
  teacher: string;
  teacherId: string | null;
  status: string;
  statusValue: string;
  problemSignals: ProblemSignal[];
  students: AdminGroupDetailStudent[];
  scheduleRules: AdminGroupScheduleRule[];
  upcomingLessons: LessonSummary[];
  studentOptions: SelectOption[];
  teacherOptions: SelectOption[];
};

export type AdminStudentItem = {
  id: string;
  name: string;
  contacts: string;
  status: string;
  groups: string;
  payment: string;
};

export type TeacherOverviewData = {
  teacherName: string;
  metrics: MetricItem[];
  upcomingLessons: LessonSummary[];
  attentionPayments: PaymentSummary[];
};

export type TeacherGroupItem = {
  id: string;
  name: string;
  course: string;
  status: string;
  students: string;
  nextLesson: string;
  nextLessonId: string | null;
  problems: string;
};

export type TeacherStudentItem = {
  id: string;
  name: string;
  contacts: string;
  groups: string;
  payment: string;
};

export type StudentOverviewData = {
  studentName: string;
  groups: string[];
  nextLesson: LessonSummary | null;
  homework: string[];
  materials: string[];
  progress: string[];
  payments: PaymentSummary[];
};

export type TeacherGroupDetailStudent = {
  id: string;
  name: string;
  contacts: string;
  payment: string;
  status: string;
};

export type TeacherGroupScheduleRule = {
  id: string;
  weekday: string;
  timeRange: string;
  period: string;
};

export type TeacherGroupHomeworkItem = {
  id: string;
  title: string;
  due: string;
  description: string;
};

export type TeacherGroupMaterialItem = {
  id: string;
  title: string;
  detail: string;
};

export type TeacherGroupDetailData = {
  id: string;
  name: string;
  course: string;
  teacher: string;
  status: string;
  metrics: MetricItem[];
  nextLesson: LessonSummary | null;
  problemSignals: ProblemSignal[];
  students: TeacherGroupDetailStudent[];
  scheduleRules: TeacherGroupScheduleRule[];
  recentLessons: LessonSummary[];
  homework: TeacherGroupHomeworkItem[];
  materials: TeacherGroupMaterialItem[];
  paymentSignals: PaymentSummary[];
};

export type TeacherJournalCell = {
  attendanceMark: "" | "absent" | "excused" | "present";
  attendanceTone: "danger" | "neutral" | "ok" | "warning";
  id: string;
  indicators: string[];
  isFuture: boolean;
  lessonId: string;
  studentId: string;
};

export type TeacherJournalLesson = {
  id: string;
  day: string;
  isWeekStart: boolean;
  timeRange: string;
  topic: string;
  weekday: string;
};

export type TeacherJournalStudent = {
  id: string;
  name: string;
  status: string;
  cells: TeacherJournalCell[];
};

export type TeacherGroupJournalData = {
  id: string;
  name: string;
  course: string;
  teacher: string;
  status: string;
  monthLabel: string;
  monthValue: string;
  previousMonth: string;
  nextMonth: string;
  lessons: TeacherJournalLesson[];
  students: TeacherJournalStudent[];
  savedEntries: string;
};

async function readSupabaseData<T>(reader: (client: SupabaseClient) => Promise<T>): Promise<DataResult<T>> {
  try {
    const client = createSupabaseAdminClient();
    const data = await reader(client);

    return { state: "ready", data };
  } catch (error) {
    if (error instanceof SupabaseServerConfigError) {
      return { state: "setup", missingEnv: error.missingEnv };
    }

    return {
      state: "error",
      message: error instanceof Error ? error.message : "Не удалось прочитать данные Supabase.",
    };
  }
}

function rows<T>(result: QueryRowsResult<T>, context: string): T[] {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }

  return result.data ?? [];
}

function single<T>(result: QuerySingleResult<T>, context: string): T {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message}`);
  }

  if (!result.data) {
    throw new Error(`${context}: запись не найдена. Проверьте seed Supabase.`);
  }

  return result.data;
}

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "не задано";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function formatMonthLabel(monthValue: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    timeZone: "Europe/Moscow",
    year: "numeric",
  }).format(new Date(`${monthValue}-01T00:00:00+03:00`));
}

function formatTimeOfDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function weekdayShortLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    weekday: "short",
  }).format(new Date(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "без срока";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "не задано";
  }

  return value.slice(0, 5);
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "активен",
    archived: "архив",
    completed: "завершен",
    exempt: "льгота",
    overdue: "просрочено",
    paid: "оплачено",
    paused: "пауза",
    pending: "ожидает",
    recruiting: "набор",
  };

  return labels[status] ?? status;
}

function groupStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "активна",
    archived: "архив",
    completed: "завершена",
    paused: "пауза",
    recruiting: "набор",
  };

  return labels[status] ?? statusLabel(status);
}

function formatLabel(value: string) {
  const labels: Record<string, string> = {
    both: "группы и индивидуально",
    group: "группы",
    individual: "индивидуально",
    tajweed: "таджвид",
  };

  return labels[value] ?? value;
}

function weekdayLabel(value: number) {
  const labels: Record<number, string> = {
    0: "воскресенье",
    1: "понедельник",
    2: "вторник",
    3: "среда",
    4: "четверг",
    5: "пятница",
    6: "суббота",
  };

  return labels[value] ?? `день ${value}`;
}

function weekdayOrderValue(value: number) {
  return value === 0 ? 7 : value;
}

function currentMoscowMonthValue() {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    timeZone: "Europe/Moscow",
    year: "numeric",
  }).formatToParts(new Date());
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}-${values.get("month")}`;
}

function normalizeMonthValue(value: string | null | undefined) {
  return value && /^\d{4}-\d{2}$/.test(value) ? value : currentMoscowMonthValue();
}

function addMonthValue(monthValue: string, delta: number) {
  const [year, month] = monthValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${date.getUTCFullYear()}-${nextMonth}`;
}

function monthBoundaryIso(monthValue: string) {
  return new Date(`${monthValue}-01T00:00:00+03:00`).toISOString();
}

function journalKey(lessonId: string, studentId: string) {
  return `${lessonId}:${studentId}`;
}

function normalizeAttendanceMark(value: string | null): TeacherJournalCell["attendanceMark"] {
  if (value === "present" || value === "absent" || value === "excused") {
    return value;
  }

  return "";
}

function attendanceTone(
  attendanceMark: TeacherJournalCell["attendanceMark"],
  isFuture: boolean,
  hasSavedEntry: boolean,
): TeacherJournalCell["attendanceTone"] {
  if (attendanceMark === "absent") {
    return "danger";
  }

  if (attendanceMark === "excused") {
    return "warning";
  }

  if (attendanceMark === "present" || (!isFuture && hasSavedEntry)) {
    return "ok";
  }

  return "neutral";
}

function isMoscowMonday(value: string) {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Moscow",
      weekday: "short",
    }).format(new Date(value)) === "Mon"
  );
}

function isPaymentAttention(payment: PaymentRow) {
  if (payment.status === "overdue") {
    return true;
  }

  if (payment.status !== "pending" || !payment.due_at) {
    return false;
  }

  return new Date(payment.due_at).getTime() < Date.now();
}

function describePaymentStatus(payment: PaymentRow) {
  if (isPaymentAttention(payment) && payment.status === "pending") {
    return "ожидает, срок прошел";
  }

  return statusLabel(payment.status);
}

async function getOrganization(client: SupabaseClient, organizationId: string) {
  const result = await client
    .from("organizations")
    .select("id,name,timezone")
    .eq("id", organizationId)
    .maybeSingle();

  return single<OrganizationRow>(result, "Организация");
}

async function getUserByEmail(client: SupabaseClient, email: string) {
  const result = await client.from("users").select("id,name,email,status").eq("email", email).maybeSingle();

  return single<UserRow>(result, `Пользователь ${email}`);
}

function summarizeLessons(lessons: LessonRow[], courses: Map<string, CourseRow>, groups: Map<string, GroupRow>) {
  return lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.topic || courses.get(lesson.course_id)?.name || "Занятие",
    subtitle: lesson.group_id ? groups.get(lesson.group_id)?.name ?? "Группа" : "Индивидуально",
    when: formatDateTime(lesson.starts_at),
  }));
}

function summarizePayments(
  payments: PaymentRow[],
  students: Map<string, StudentRow>,
  courses: Map<string, CourseRow>,
  groups: Map<string, GroupRow>,
) {
  return payments.map((payment) => ({
    id: payment.id,
    studentName: students.get(payment.student_id)?.name ?? "Ученик",
    context:
      groups.get(payment.group_id ?? "")?.name ??
      courses.get(payment.course_id ?? "")?.name ??
      "Учебный контекст",
    amount: formatMoney(payment.amount, payment.currency),
    due: formatDate(payment.due_at),
    status: describePaymentStatus(payment),
  }));
}

function summarizeScheduleRules(scheduleRules: ScheduleRuleRow[]) {
  return scheduleRules
    .slice()
    .sort(
      (left, right) =>
        weekdayOrderValue(left.weekday) - weekdayOrderValue(right.weekday) ||
        left.start_time.localeCompare(right.start_time),
    )
    .map((rule) => ({
      id: rule.id,
      weekday: weekdayLabel(rule.weekday),
      timeRange: `${formatTime(rule.start_time)}-${formatTime(rule.end_time)}`,
      period: `с ${formatDate(rule.starts_on)} ${rule.ends_on ? `до ${formatDate(rule.ends_on)}` : "без окончания"}`,
    }));
}

async function getBaseOrganizationData(client: SupabaseClient, organizationId: string) {
  const [organizationResult, coursesResult, groupsResult, studentsResult, usersResult, membersResult] =
    await Promise.all([
      client.from("organizations").select("id,name,timezone").eq("id", organizationId).maybeSingle(),
      client.from("courses").select("id,name,description,type,format,status").eq("organization_id", organizationId),
      client.from("groups").select("id,course_id,teacher_id,name,status").eq("organization_id", organizationId),
      client.from("students").select("id,user_id,name,phone,email,status").eq("organization_id", organizationId),
      client.from("users").select("id,name,email,status"),
      client.from("organization_members").select("id,user_id,roles,permissions").eq("organization_id", organizationId),
    ]);

  return {
    organization: single<OrganizationRow>(organizationResult, "Организация"),
    courses: rows<CourseRow>(coursesResult, "Курсы"),
    groups: rows<GroupRow>(groupsResult, "Группы"),
    students: rows<StudentRow>(studentsResult, "Ученики"),
    users: rows<UserRow>(usersResult, "Пользователи"),
    members: rows<MemberRow>(membersResult, "Роли"),
  };
}

export async function getAdminOverview(organizationId: string) {
  return readSupabaseData<AdminOverviewData>(async (client) => {
    const { organization, courses, groups, students, members } = await getBaseOrganizationData(client, organizationId);
    const now = new Date().toISOString();
    const [lessonsResult, paymentsResult] = await Promise.all([
      client
        .from("lessons")
        .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
        .eq("organization_id", organizationId)
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(5),
      client
        .from("payments")
        .select("id,student_id,course_id,group_id,amount,currency,period_start,period_end,due_at,status")
        .eq("organization_id", organizationId),
    ]);
    const lessons = rows<LessonRow>(lessonsResult, "Ближайшие занятия");
    const payments = rows<PaymentRow>(paymentsResult, "Оплата");
    const courseMap = byId(courses);
    const groupMap = byId(groups);
    const studentMap = byId(students);
    const attentionPayments = payments.filter(isPaymentAttention).slice(0, 5);
    const teacherCount = members.filter((member) => member.roles.includes("teacher")).length;

    return {
      organizationName: organization.name,
      metrics: [
        { label: "Курсы", value: String(courses.length), detail: "активная учебная база" },
        { label: "Группы", value: String(groups.length), detail: "в Supabase dev" },
        { label: "Преподаватели", value: String(teacherCount), detail: "по ролям организации" },
        { label: "Ученики", value: String(students.length), detail: "учебные карточки" },
      ],
      upcomingLessons: summarizeLessons(lessons, courseMap, groupMap),
      duePayments: summarizePayments(attentionPayments, studentMap, courseMap, groupMap),
    };
  });
}

export async function getAdminCourses(organizationId: string) {
  return readSupabaseData<{ courses: AdminCourseItem[] }>(async (client) => {
    const { courses, groups } = await getBaseOrganizationData(client, organizationId);

    return {
      courses: courses.map((course) => ({
        id: course.id,
        name: course.name,
        description: course.description ?? "Описание пока не заполнено",
        format: formatLabel(course.format),
        status: statusLabel(course.status),
        groupCount: String(groups.filter((group) => group.course_id === course.id).length),
      })),
    };
  });
}

export async function getAdminGroups(organizationId: string) {
  return readSupabaseData<AdminGroupsData>(async (client) => {
    const { courses, groups, members, students, users } = await getBaseOrganizationData(client, organizationId);
    const groupIds = groups.map((group) => group.id);
    const [groupStudentsResult, lessonsResult] = await Promise.all([
      groupIds.length > 0
        ? client.from("group_students").select("id,group_id,student_id,status").in("group_id", groupIds)
        : Promise.resolve({ data: [], error: null }),
      groupIds.length > 0
        ? client
            .from("lessons")
            .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
            .in("group_id", groupIds)
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Состав групп");
    const lessons = rows<LessonRow>(lessonsResult, "Занятия групп");
    const courseMap = byId(courses);
    const userMap = byId(users);
    const teacherIds = new Set(
      members
        .filter((member) => member.roles.includes("teacher") && member.user_id)
        .map((member) => member.user_id),
    );

    return {
      groups: groups.map((group) => {
        const nextLesson = lessons.find((lesson) => lesson.group_id === group.id);

        return {
          id: group.id,
          name: group.name,
          course: courseMap.get(group.course_id)?.name ?? "Курс",
          teacher: group.teacher_id ? userMap.get(group.teacher_id)?.name ?? "Не назначен" : "Не назначен",
          status: groupStatusLabel(group.status),
          students: String(groupStudents.filter((item) => item.group_id === group.id && item.status === "active").length),
          nextLesson: nextLesson ? formatDateTime(nextLesson.starts_at) : "нет ближайшего занятия",
        };
      }),
      courseOptions: courses
        .filter((course) => course.status === "active")
        .map((course) => ({ label: course.name, value: course.id })),
      groupOptions: groups
        .filter((group) => group.status === "active" || group.status === "recruiting")
        .map((group) => ({ label: group.name, value: group.id })),
      studentOptions: students
        .filter((student) => student.status === "active")
        .map((student) => ({ label: student.name, value: student.id })),
      teacherOptions: users
        .filter((user) => user.status === "active" && teacherIds.has(user.id))
        .map((user) => ({ label: user.name, value: user.id })),
    };
  });
}

export async function getAdminGroupDetail(organizationId: string, groupId: string) {
  return readSupabaseData<AdminGroupDetailData>(async (client) => {
    const { courses, groups, members, students, users } = await getBaseOrganizationData(client, organizationId);
    const group = groups.find((item) => item.id === groupId);

    if (!group) {
      throw new Error("Группа: запись не найдена.");
    }

    const now = new Date().toISOString();
    const [groupStudentsResult, scheduleRulesResult, lessonsResult] = await Promise.all([
      client.from("group_students").select("id,group_id,student_id,status,joined_at,left_at").eq("group_id", groupId),
      client
        .from("schedule_rules")
        .select("id,target_type,target_id,weekday,start_time,end_time,starts_on,ends_on,status")
        .eq("organization_id", organizationId)
        .eq("target_type", "group")
        .eq("target_id", groupId)
        .eq("status", "active")
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true }),
      client
        .from("lessons")
        .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
        .eq("organization_id", organizationId)
        .eq("group_id", groupId)
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(5),
    ]);
    const groupStudents = rows<GroupStudentRow & { joined_at: string | null }>(groupStudentsResult, "Состав группы");
    const scheduleRules = rows<ScheduleRuleRow>(scheduleRulesResult, "Расписание группы");
    const lessons = rows<LessonRow>(lessonsResult, "Ближайшие занятия группы");
    const courseMap = byId(courses);
    const studentMap = byId(students);
    const userMap = byId(users);
    const teacherIds = new Set(
      members
        .filter((member) => member.roles.includes("teacher") && member.user_id)
        .map((member) => member.user_id),
    );
    const activeGroupStudents = groupStudents.filter((item) => item.status === "active");
    const activeStudentIds = new Set(activeGroupStudents.map((item) => item.student_id));
    const teacherName = group.teacher_id ? userMap.get(group.teacher_id)?.name ?? "Не назначен" : "Не назначен";
    const problemSignals: ProblemSignal[] = [
      !group.teacher_id
        ? {
            detail: "У группы нет преподавателя.",
            label: "Нет преподавателя",
            tone: "warning",
          }
        : null,
      activeGroupStudents.length === 0
        ? {
            detail: "В активном составе пока нет учеников.",
            label: "Нет учеников",
            tone: "warning",
          }
        : null,
      scheduleRules.length === 0
        ? {
            detail: "Активное расписание для группы не найдено.",
            label: "Нет расписания",
            tone: "warning",
          }
        : null,
      lessons.length === 0
        ? {
            detail: "Ближайшие занятия для группы не созданы.",
            label: "Нет ближайших занятий",
            tone: "warning",
          }
        : null,
    ].filter((item): item is ProblemSignal => item !== null);

    return {
      id: group.id,
      name: group.name,
      course: courseMap.get(group.course_id)?.name ?? "Курс",
      teacher: teacherName,
      teacherId: group.teacher_id,
      status: groupStatusLabel(group.status),
      statusValue: group.status,
      problemSignals,
      students: activeGroupStudents.map((item) => {
        const student = studentMap.get(item.student_id);

        return {
          id: item.student_id,
          groupStudentId: item.id,
          name: student?.name ?? "Ученик",
          contacts: [student?.phone, student?.email].filter(Boolean).join(", ") || "контакты не заполнены",
          joinedAt: formatDate(item.joined_at),
          status: statusLabel(item.status),
        };
      }),
      scheduleRules: summarizeScheduleRules(scheduleRules),
      upcomingLessons: summarizeLessons(lessons, courseMap, new Map([[group.id, group]])),
      studentOptions: students
        .filter((student) => student.status === "active" && !activeStudentIds.has(student.id))
        .map((student) => ({ label: student.name, value: student.id })),
      teacherOptions: users
        .filter((user) => user.status === "active" && teacherIds.has(user.id))
        .map((user) => ({ label: user.name, value: user.id })),
    };
  });
}

export async function getAdminStudents(organizationId: string) {
  return readSupabaseData<{ students: AdminStudentItem[] }>(async (client) => {
    const { courses, groups, students } = await getBaseOrganizationData(client, organizationId);
    const studentIds = students.map((student) => student.id);
    const [groupStudentsResult, paymentsResult] = await Promise.all([
      studentIds.length > 0
        ? client.from("group_students").select("id,group_id,student_id,status").in("student_id", studentIds)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length > 0
        ? client
            .from("payments")
            .select("id,student_id,course_id,group_id,amount,currency,period_start,period_end,due_at,status")
            .in("student_id", studentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Группы учеников");
    const payments = rows<PaymentRow>(paymentsResult, "Оплата учеников");
    const courseMap = byId(courses);
    const groupMap = byId(groups);

    return {
      students: students.map((student) => {
        const studentGroupIds = groupStudents
          .filter((item) => item.student_id === student.id && item.status === "active")
          .map((item) => item.group_id);
        const studentPayments = payments.filter((payment) => payment.student_id === student.id);
        const attentionPayment = studentPayments.find(isPaymentAttention) ?? studentPayments[0];

        return {
          id: student.id,
          name: student.name,
          contacts: [student.phone, student.email].filter(Boolean).join(", ") || "контакты не заполнены",
          status: statusLabel(student.status),
          groups:
            studentGroupIds.map((groupId) => groupMap.get(groupId)?.name).filter(Boolean).join(", ") ||
            courseMap.get(attentionPayment?.course_id ?? "")?.name ||
            "не назначен",
          payment: attentionPayment
            ? `${formatMoney(attentionPayment.amount, attentionPayment.currency)} - ${describePaymentStatus(attentionPayment)}`
            : "не настроена",
        };
      }),
    };
  });
}

export async function getTeacherOverview(organizationId: string, email: string) {
  return readSupabaseData<TeacherOverviewData>(async (client) => {
    const teacher = await getUserByEmail(client, email);
    const { courses, groups, students } = await getBaseOrganizationData(client, organizationId);
    const teacherGroups = groups.filter((group) => group.teacher_id === teacher.id);
    const groupIds = teacherGroups.map((group) => group.id);
    const [groupStudentsResult, lessonsResult, paymentsResult] = await Promise.all([
      groupIds.length > 0
        ? client.from("group_students").select("id,group_id,student_id,status").in("group_id", groupIds)
        : Promise.resolve({ data: [], error: null }),
      groupIds.length > 0
        ? client
            .from("lessons")
            .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
            .in("group_id", groupIds)
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      client
        .from("payments")
        .select("id,student_id,course_id,group_id,amount,currency,period_start,period_end,due_at,status")
        .eq("organization_id", organizationId),
    ]);
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Состав групп преподавателя");
    const lessons = rows<LessonRow>(lessonsResult, "Занятия преподавателя");
    const payments = rows<PaymentRow>(paymentsResult, "Оплата учеников преподавателя");
    const studentIds = new Set(groupStudents.filter((item) => item.status === "active").map((item) => item.student_id));
    const studentMap = byId(students.filter((student) => studentIds.has(student.id)));
    const courseMap = byId(courses);
    const groupMap = byId(teacherGroups);
    const attentionPayments = payments
      .filter((payment) => studentIds.has(payment.student_id))
      .filter(isPaymentAttention)
      .slice(0, 5);

    return {
      teacherName: teacher.name,
      metrics: [
        { label: "Мои группы", value: String(teacherGroups.length) },
        { label: "Ученики", value: String(studentIds.size) },
        { label: "Ближайшие занятия", value: String(lessons.length) },
        { label: "Оплата к вниманию", value: String(attentionPayments.length) },
      ],
      upcomingLessons: summarizeLessons(lessons, courseMap, groupMap),
      attentionPayments: summarizePayments(attentionPayments, studentMap, courseMap, groupMap),
    };
  });
}

export async function getTeacherGroups(organizationId: string, email: string) {
  return readSupabaseData<{ groups: TeacherGroupItem[] }>(async (client) => {
    const teacher = await getUserByEmail(client, email);
    const { courses, groups } = await getBaseOrganizationData(client, organizationId);
    const teacherGroups = groups.filter((group) => group.teacher_id === teacher.id);
    const groupIds = teacherGroups.map((group) => group.id);
    const [groupStudentsResult, lessonsResult, scheduleRulesResult, paymentsResult] = await Promise.all([
      groupIds.length > 0
        ? client.from("group_students").select("id,group_id,student_id,status").in("group_id", groupIds)
        : Promise.resolve({ data: [], error: null }),
      groupIds.length > 0
        ? client
            .from("lessons")
            .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
            .in("group_id", groupIds)
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      groupIds.length > 0
        ? client
            .from("schedule_rules")
            .select("id,target_type,target_id,weekday,start_time,end_time,starts_on,ends_on,status")
            .eq("organization_id", organizationId)
            .eq("target_type", "group")
            .in("target_id", groupIds)
            .eq("status", "active")
        : Promise.resolve({ data: [], error: null }),
      client
        .from("payments")
        .select("id,student_id,course_id,group_id,amount,currency,period_start,period_end,due_at,status")
        .eq("organization_id", organizationId),
    ]);
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Состав групп преподавателя");
    const lessons = rows<LessonRow>(lessonsResult, "Занятия групп преподавателя");
    const scheduleRules = rows<ScheduleRuleRow>(scheduleRulesResult, "Расписание групп преподавателя");
    const payments = rows<PaymentRow>(paymentsResult, "Оплата учеников преподавателя");
    const courseMap = byId(courses);

    return {
      groups: teacherGroups.map((group) => {
        const nextLesson = lessons.find((lesson) => lesson.group_id === group.id);
        const activeGroupStudents = groupStudents.filter((item) => item.group_id === group.id && item.status === "active");
        const activeStudentIds = new Set(activeGroupStudents.map((item) => item.student_id));
        const attentionPayments = payments
          .filter((payment) => activeStudentIds.has(payment.student_id))
          .filter((payment) => payment.group_id === group.id || payment.course_id === group.course_id)
          .filter(isPaymentAttention);
        const problems = [
          activeGroupStudents.length === 0 ? "нет учеников" : null,
          scheduleRules.some((rule) => rule.target_id === group.id) ? null : "нет расписания",
          nextLesson ? null : "нет ближайшего урока",
          attentionPayments.length > 0 ? `оплата: ${attentionPayments.length}` : null,
        ].filter(Boolean);

        return {
          id: group.id,
          name: group.name,
          course: courseMap.get(group.course_id)?.name ?? "Курс",
          status: groupStatusLabel(group.status),
          students: String(activeGroupStudents.length),
          nextLesson: nextLesson ? formatDateTime(nextLesson.starts_at) : "нет ближайшего занятия",
          nextLessonId: nextLesson?.id ?? null,
          problems: problems.join(", ") || "без критичных признаков",
        };
      }),
    };
  });
}

export async function getTeacherGroupDetail(organizationId: string, email: string, groupId: string) {
  return readSupabaseData<TeacherGroupDetailData>(async (client) => {
    const teacher = await getUserByEmail(client, email);
    const { courses, groups, students, users } = await getBaseOrganizationData(client, organizationId);
    const group = groups.find((item) => item.id === groupId && item.teacher_id === teacher.id);

    if (!group) {
      throw new Error("Группа: запись не найдена.");
    }

    const now = new Date().toISOString();
    const [groupStudentsResult, scheduleRulesResult, upcomingLessonsResult, recentLessonsResult, homeworkResult, materialsResult, paymentsResult] =
      await Promise.all([
        client.from("group_students").select("id,group_id,student_id,status").eq("group_id", groupId),
        client
          .from("schedule_rules")
          .select("id,target_type,target_id,weekday,start_time,end_time,starts_on,ends_on,status")
          .eq("organization_id", organizationId)
          .eq("target_type", "group")
          .eq("target_id", groupId)
          .eq("status", "active")
          .order("weekday", { ascending: true })
          .order("start_time", { ascending: true }),
        client
          .from("lessons")
          .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
          .eq("organization_id", organizationId)
          .eq("group_id", groupId)
          .gte("starts_at", now)
          .order("starts_at", { ascending: true })
          .limit(5),
        client
          .from("lessons")
          .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
          .eq("organization_id", organizationId)
          .eq("group_id", groupId)
          .lt("starts_at", now)
          .order("starts_at", { ascending: false })
          .limit(5),
        client
          .from("homework")
          .select("id,course_id,group_id,student_id,title,description,due_at,status")
          .eq("organization_id", organizationId)
          .eq("status", "active")
          .order("due_at", { ascending: true, nullsFirst: false })
          .limit(20),
        client
          .from("materials")
          .select("id,course_id,group_id,student_id,title,type,content,url,visibility,status")
          .eq("organization_id", organizationId)
          .eq("status", "active")
          .limit(20),
        client
          .from("payments")
          .select("id,student_id,course_id,group_id,amount,currency,period_start,period_end,due_at,status")
          .eq("organization_id", organizationId),
      ]);

    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Состав группы преподавателя");
    const scheduleRules = rows<ScheduleRuleRow>(scheduleRulesResult, "Расписание группы преподавателя");
    const upcomingLessons = rows<LessonRow>(upcomingLessonsResult, "Ближайшие занятия группы преподавателя");
    const recentLessons = rows<LessonRow>(recentLessonsResult, "Последние занятия группы преподавателя");
    const homework = rows<HomeworkRow>(homeworkResult, "Домашние задания группы преподавателя");
    const materials = rows<MaterialRow>(materialsResult, "Материалы группы преподавателя");
    const payments = rows<PaymentRow>(paymentsResult, "Оплата группы преподавателя");
    const courseMap = byId(courses);
    const groupMap = new Map([[group.id, group]]);
    const studentMap = byId(students);
    const userMap = byId(users);
    const activeGroupStudents = groupStudents.filter((item) => item.status === "active");
    const activeStudentIds = new Set(activeGroupStudents.map((item) => item.student_id));
    const groupPayments = payments.filter(
      (payment) =>
        activeStudentIds.has(payment.student_id) &&
        (payment.group_id === group.id || payment.course_id === group.course_id),
    );
    const attentionPayments = groupPayments.filter(isPaymentAttention);
    const nextLesson = summarizeLessons(upcomingLessons.slice(0, 1), courseMap, groupMap)[0] ?? null;
    const visibleHomework = homework
      .filter((item) => item.group_id === group.id)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        due: formatDate(item.due_at),
        description: item.description ?? "Описание не заполнено",
      }));
    const visibleMaterials = materials
      .filter((item) => item.group_id === group.id || (item.course_id === group.course_id && !item.student_id))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.title,
        detail: `${item.type === "link" ? "ссылка" : "текст"}; ${
          item.visibility === "visible_to_students" ? "видно ученикам" : "только преподавателю"
        }`,
      }));
    const problemSignals: ProblemSignal[] = [
      activeGroupStudents.length === 0
        ? {
            detail: "В активном составе пока нет учеников.",
            label: "Нет учеников",
            tone: "warning",
          }
        : null,
      scheduleRules.length === 0
        ? {
            detail: "Активное расписание для группы не найдено.",
            label: "Нет расписания",
            tone: "warning",
          }
        : null,
      upcomingLessons.length === 0
        ? {
            detail: "Ближайшие занятия еще не созданы.",
            label: "Нет ближайшего урока",
            tone: "warning",
          }
        : null,
      attentionPayments.length > 0
        ? {
            detail: `Есть записи оплаты, которым нужно внимание: ${attentionPayments.length}.`,
            label: "Оплата",
            tone: "danger",
          }
        : null,
    ].filter((item): item is ProblemSignal => item !== null);

    return {
      id: group.id,
      name: group.name,
      course: courseMap.get(group.course_id)?.name ?? "Курс",
      teacher: group.teacher_id ? userMap.get(group.teacher_id)?.name ?? teacher.name : teacher.name,
      status: groupStatusLabel(group.status),
      metrics: [
        { label: "Ученики", value: String(activeGroupStudents.length) },
        { label: "Расписание", value: String(scheduleRules.length) },
        { label: "Ближайшие уроки", value: String(upcomingLessons.length) },
        { label: "Оплата к вниманию", value: String(attentionPayments.length) },
      ],
      nextLesson,
      problemSignals,
      students: activeGroupStudents.map((item) => {
        const student = studentMap.get(item.student_id);
        const studentPayment = groupPayments.find((payment) => payment.student_id === item.student_id && isPaymentAttention(payment)) ??
          groupPayments.find((payment) => payment.student_id === item.student_id);

        return {
          id: item.student_id,
          name: student?.name ?? "Ученик",
          contacts: [student?.phone, student?.email].filter(Boolean).join(", ") || "контакты не заполнены",
          status: statusLabel(item.status),
          payment: studentPayment
            ? `${formatMoney(studentPayment.amount, studentPayment.currency)} - ${describePaymentStatus(studentPayment)}`
            : "не настроена",
        };
      }),
      scheduleRules: summarizeScheduleRules(scheduleRules),
      recentLessons: summarizeLessons(recentLessons, courseMap, groupMap),
      homework: visibleHomework,
      materials: visibleMaterials,
      paymentSignals: summarizePayments(attentionPayments.slice(0, 5), studentMap, courseMap, groupMap),
    };
  });
}

export async function getTeacherGroupJournal(organizationId: string, email: string, groupId: string, month: string | null | undefined) {
  return readSupabaseData<TeacherGroupJournalData>(async (client) => {
    const teacher = await getUserByEmail(client, email);
    const { courses, groups, students, users } = await getBaseOrganizationData(client, organizationId);
    const group = groups.find((item) => item.id === groupId && item.teacher_id === teacher.id);

    if (!group) {
      throw new Error("Группа: запись не найдена.");
    }

    const monthValue = normalizeMonthValue(month);
    const nextMonth = addMonthValue(monthValue, 1);
    const [lessonsResult, groupStudentsResult] = await Promise.all([
      client
        .from("lessons")
        .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
        .eq("organization_id", organizationId)
        .eq("group_id", groupId)
        .gte("starts_at", monthBoundaryIso(monthValue))
        .lt("starts_at", monthBoundaryIso(nextMonth))
        .order("starts_at", { ascending: true }),
      client.from("group_students").select("id,group_id,student_id,status").eq("group_id", groupId),
    ]);

    const lessons = rows<LessonRow>(lessonsResult, "Уроки журнала группы");
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Состав журнала группы");
    const lessonIds = lessons.map((lesson) => lesson.id);
    const activeGroupStudents = groupStudents.filter((item) => item.status === "active");
    const activeStudentIds = new Set(activeGroupStudents.map((item) => item.student_id));
    const [journalResult, progressResult, homeworkResult, materialsResult] = await Promise.all([
      lessonIds.length > 0
        ? client
            .from("journal_entries")
            .select("id,lesson_id,student_id,attendance_mark,lesson_mark,teacher_comment,internal_comment,is_visible_to_student")
            .in("lesson_id", lessonIds)
        : Promise.resolve({ data: [], error: null }),
      lessonIds.length > 0
        ? client.from("progress_records").select("id,lesson_id,student_id").eq("organization_id", organizationId).in("lesson_id", lessonIds)
        : Promise.resolve({ data: [], error: null }),
      lessonIds.length > 0
        ? client
            .from("homework")
            .select("id,course_id,group_id,student_id,lesson_id,title,description,due_at,status")
            .eq("organization_id", organizationId)
            .eq("status", "active")
            .in("lesson_id", lessonIds)
        : Promise.resolve({ data: [], error: null }),
      lessonIds.length > 0
        ? client
            .from("materials")
            .select("id,course_id,group_id,student_id,lesson_id,homework_id,title,type,content,url,visibility,status")
            .eq("organization_id", organizationId)
            .eq("status", "active")
        : Promise.resolve({ data: [], error: null }),
    ]);

    const journalEntries = rows<JournalEntryRow>(journalResult, "Записи журнала группы").filter((entry) =>
      activeStudentIds.has(entry.student_id),
    );
    const progressRecords = rows<ProgressRecordLessonRow>(progressResult, "Прогресс журнала группы").filter(
      (record) => record.lesson_id && activeStudentIds.has(record.student_id),
    );
    const homework = rows<HomeworkRow>(homeworkResult, "Домашние задания журнала группы");
    const materials = rows<MaterialRow>(materialsResult, "Материалы журнала группы").filter(
      (material) => material.group_id === group.id || material.course_id === group.course_id,
    );
    const courseMap = byId(courses);
    const studentMap = byId(students);
    const userMap = byId(users);
    const journalEntryMap = new Map(journalEntries.map((entry) => [journalKey(entry.lesson_id, entry.student_id), entry]));
    const progressKeys = new Set(
      progressRecords
        .filter((record): record is ProgressRecordLessonRow & { lesson_id: string } => record.lesson_id !== null)
        .map((record) => journalKey(record.lesson_id, record.student_id)),
    );
    const homeworkByLessonId = new Map<string, HomeworkRow[]>();
    const homeworkIdToLessonId = new Map<string, string>();

    for (const item of homework) {
      if (!item.lesson_id) {
        continue;
      }

      const items = homeworkByLessonId.get(item.lesson_id) ?? [];
      items.push(item);
      homeworkByLessonId.set(item.lesson_id, items);
      homeworkIdToLessonId.set(item.id, item.lesson_id);
    }

    const materialLessonIds = new Set(
      materials
        .map((material) => material.lesson_id ?? (material.homework_id ? homeworkIdToLessonId.get(material.homework_id) : null))
        .filter((lessonId): lessonId is string => Boolean(lessonId)),
    );
    const now = Date.now();
    const journalLessons = lessons.map((lesson) => ({
      id: lesson.id,
      day: formatDateShort(lesson.starts_at),
      isWeekStart: isMoscowMonday(lesson.starts_at),
      timeRange: `${formatTimeOfDate(lesson.starts_at)}-${formatTimeOfDate(lesson.ends_at)}`,
      topic: lesson.topic ?? courseMap.get(lesson.course_id)?.name ?? "Урок",
      weekday: weekdayShortLabel(lesson.starts_at),
    }));
    const journalStudents = activeGroupStudents
      .map((item) => {
        const student = studentMap.get(item.student_id);
        const name = student?.name ?? "Ученик";

        return {
          id: item.student_id,
          name,
          status: statusLabel(item.status),
          cells: lessons.map((lesson) => {
            const key = journalKey(lesson.id, item.student_id);
            const entry = journalEntryMap.get(key);
            const attendanceMark = normalizeAttendanceMark(entry?.attendance_mark ?? null);
            const isFuture = new Date(lesson.starts_at).getTime() > now;
            const indicators = [
              entry?.lesson_mark ? `Оценка ${entry.lesson_mark}` : null,
              entry?.teacher_comment ? "Комментарий" : null,
              entry?.internal_comment ? "Внутренний комментарий" : null,
              progressKeys.has(key) ? "Прогресс" : null,
              homeworkByLessonId.has(lesson.id) ? "ДЗ" : null,
              materialLessonIds.has(lesson.id) ? "Материал" : null,
              !isFuture && entry && !attendanceMark ? "Пусто = П" : null,
            ].filter((indicator): indicator is string => indicator !== null);

            return {
              attendanceMark,
              attendanceTone: attendanceTone(attendanceMark, isFuture, Boolean(entry)),
              id: key,
              indicators,
              isFuture,
              lessonId: lesson.id,
              studentId: item.student_id,
            };
          }),
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, "ru"));

    return {
      id: group.id,
      name: group.name,
      course: courseMap.get(group.course_id)?.name ?? "Курс",
      teacher: group.teacher_id ? userMap.get(group.teacher_id)?.name ?? teacher.name : teacher.name,
      status: groupStatusLabel(group.status),
      monthLabel: formatMonthLabel(monthValue),
      monthValue,
      previousMonth: addMonthValue(monthValue, -1),
      nextMonth,
      lessons: journalLessons,
      students: journalStudents,
      savedEntries: String(journalEntries.length),
    };
  });
}

export async function getTeacherStudents(organizationId: string, email: string) {
  return readSupabaseData<{ students: TeacherStudentItem[] }>(async (client) => {
    const teacher = await getUserByEmail(client, email);
    const { groups, students } = await getBaseOrganizationData(client, organizationId);
    const teacherGroups = groups.filter((group) => group.teacher_id === teacher.id);
    const groupIds = teacherGroups.map((group) => group.id);
    const groupMap = byId(teacherGroups);
    const [groupStudentsResult, paymentsResult] = await Promise.all([
      groupIds.length > 0
        ? client.from("group_students").select("id,group_id,student_id,status").in("group_id", groupIds)
        : Promise.resolve({ data: [], error: null }),
      client
        .from("payments")
        .select("id,student_id,course_id,group_id,amount,currency,period_start,period_end,due_at,status")
        .eq("organization_id", organizationId),
    ]);
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Ученики преподавателя");
    const payments = rows<PaymentRow>(paymentsResult, "Оплата учеников преподавателя");
    const studentIds = new Set(groupStudents.filter((item) => item.status === "active").map((item) => item.student_id));
    const visibleStudents = students.filter((student) => studentIds.has(student.id));

    return {
      students: visibleStudents.map((student) => {
        const activeGroups = groupStudents
          .filter((item) => item.student_id === student.id && item.status === "active")
          .map((item) => groupMap.get(item.group_id)?.name)
          .filter(Boolean);
        const attentionPayment = payments
          .filter((payment) => payment.student_id === student.id)
          .find(isPaymentAttention);

        return {
          id: student.id,
          name: student.name,
          contacts: [student.phone, student.email].filter(Boolean).join(", ") || "контакты не заполнены",
          groups: activeGroups.join(", ") || "нет активной группы",
          payment: attentionPayment
            ? `${formatMoney(attentionPayment.amount, attentionPayment.currency)} - ${describePaymentStatus(attentionPayment)}`
            : "без внимания",
        };
      }),
    };
  });
}

export async function getStudentOverview(organizationId: string, email: string) {
  return readSupabaseData<StudentOverviewData>(async (client) => {
    const user = await getUserByEmail(client, email);
    const studentResult = await client
      .from("students")
      .select("id,user_id,name,phone,email,status")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .maybeSingle();
    const student = single<StudentRow>(studentResult, "Карточка ученика");
    const { courses, groups } = await getBaseOrganizationData(client, organizationId);
    const [groupStudentsResult, homeworkResult, materialsResult, progressResult, paymentsResult] = await Promise.all([
      client.from("group_students").select("id,group_id,student_id,status").eq("student_id", student.id),
      client
        .from("homework")
        .select("id,course_id,group_id,student_id,title,description,due_at,status")
        .eq("organization_id", organizationId)
        .eq("status", "active"),
      client
        .from("materials")
        .select("id,course_id,group_id,student_id,title,type,content,url,visibility,status")
        .eq("organization_id", organizationId)
        .eq("visibility", "visible_to_students")
        .eq("status", "active"),
      client
        .from("student_progress_rules")
        .select("id,student_id,course_id,name,level,note,is_visible_to_student,is_active")
        .eq("student_id", student.id)
        .eq("is_visible_to_student", true)
        .eq("is_active", true),
      client
        .from("payments")
        .select("id,student_id,course_id,group_id,amount,currency,period_start,period_end,due_at,status")
        .eq("student_id", student.id),
    ]);
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Группы ученика");
    const activeGroupIds = new Set(groupStudents.filter((item) => item.status === "active").map((item) => item.group_id));
    const courseMap = byId(courses);
    const visibleGroups = groups.filter((group) => activeGroupIds.has(group.id));
    const groupMap = byId(visibleGroups);
    const lessonsResult =
      activeGroupIds.size > 0
        ? await client
            .from("lessons")
            .select("id,course_id,group_id,teacher_id,starts_at,ends_at,topic")
            .in("group_id", [...activeGroupIds])
            .gte("starts_at", new Date().toISOString())
            .order("starts_at", { ascending: true })
            .limit(1)
        : { data: [], error: null };
    const lessons = rows<LessonRow>(lessonsResult, "Ближайшее занятие ученика");
    const homework = rows<HomeworkRow>(homeworkResult, "Домашние задания ученика").filter(
      (item) => item.student_id === student.id || (item.group_id ? activeGroupIds.has(item.group_id) : false),
    );
    const materials = rows<MaterialRow>(materialsResult, "Материалы ученика").filter(
      (item) => item.student_id === student.id || (item.group_id ? activeGroupIds.has(item.group_id) : false),
    );
    const progress = rows<ProgressRuleRow>(progressResult, "Прогресс ученика");
    const payments = rows<PaymentRow>(paymentsResult, "Оплата ученика");

    return {
      studentName: student.name,
      groups: visibleGroups.map((group) => `${group.name} - ${courseMap.get(group.course_id)?.name ?? "курс"}`),
      nextLesson: summarizeLessons(lessons, courseMap, groupMap)[0] ?? null,
      homework: homework.slice(0, 5).map((item) => `${item.title} - срок ${formatDate(item.due_at)}`),
      materials: materials.slice(0, 5).map((item) => (item.url ? `${item.title} - ${item.url}` : item.title)),
      progress: progress.slice(0, 5).map((item) => `${item.name}${item.level ? ` - ${statusLabel(item.level)}` : ""}`),
      payments: summarizePayments(payments, new Map([[student.id, student]]), courseMap, groupMap),
    };
  });
}
