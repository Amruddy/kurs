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

type HomeworkRow = {
  id: string;
  course_id: string;
  group_id: string | null;
  student_id: string | null;
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
  title: string;
  type: string;
  content: string | null;
  url: string | null;
  visibility: string;
  status: string;
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

function formatLabel(value: string) {
  const labels: Record<string, string> = {
    both: "группы и индивидуально",
    group: "группы",
    individual: "индивидуально",
    tajweed: "таджвид",
  };

  return labels[value] ?? value;
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
  return readSupabaseData<{ groups: AdminGroupItem[] }>(async (client) => {
    const { courses, groups, users } = await getBaseOrganizationData(client, organizationId);
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

    return {
      groups: groups.map((group) => {
        const nextLesson = lessons.find((lesson) => lesson.group_id === group.id);

        return {
          id: group.id,
          name: group.name,
          course: courseMap.get(group.course_id)?.name ?? "Курс",
          teacher: group.teacher_id ? userMap.get(group.teacher_id)?.name ?? "Не назначен" : "Не назначен",
          status: statusLabel(group.status),
          students: String(groupStudents.filter((item) => item.group_id === group.id && item.status === "active").length),
          nextLesson: nextLesson ? formatDateTime(nextLesson.starts_at) : "нет ближайшего занятия",
        };
      }),
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
    const groupStudents = rows<GroupStudentRow>(groupStudentsResult, "Состав групп преподавателя");
    const lessons = rows<LessonRow>(lessonsResult, "Занятия групп преподавателя");
    const courseMap = byId(courses);

    return {
      groups: teacherGroups.map((group) => {
        const nextLesson = lessons.find((lesson) => lesson.group_id === group.id);

        return {
          id: group.id,
          name: group.name,
          course: courseMap.get(group.course_id)?.name ?? "Курс",
          status: statusLabel(group.status),
          students: String(groupStudents.filter((item) => item.group_id === group.id && item.status === "active").length),
          nextLesson: nextLesson ? formatDateTime(nextLesson.starts_at) : "нет ближайшего занятия",
        };
      }),
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

