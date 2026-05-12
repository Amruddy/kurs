import { PrismaPg } from "@prisma/adapter-pg";
import {
  AttendanceMark,
  CourseFormat,
  LessonMarkScale,
  MaterialType,
  PaymentPeriodType,
  PaymentStatus,
  Permission,
  PrismaClient,
  ProgressLevel,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const ids = {
  organization: "smoke-organization",
  adminUser: "smoke-admin-user",
  teacherUser: "smoke-teacher-user",
  studentUser: "smoke-student-user",
  course: "smoke-course-tajweed",
  progressSettings: "smoke-progress-settings",
  student: "smoke-student",
  group: "smoke-group",
  scheduleRule: "smoke-schedule-rule",
  lesson: "smoke-lesson",
  journalEntry: "smoke-journal-entry",
  progressRecord: "smoke-progress-record",
  progressRule: "smoke-progress-rule",
  progressError: "smoke-progress-error",
  homework: "smoke-homework",
  material: "smoke-material",
  payment: "smoke-payment",
};

function assertSmoke(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Smoke failed: ${message}`);
  }
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: ids.organization },
    update: {
      name: "Smoke MVP",
      type: "learning_center",
      status: "active",
    },
    create: {
      id: ids.organization,
      name: "Smoke MVP",
      type: "learning_center",
      status: "active",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "smoke-admin@example.test" },
    update: { id: ids.adminUser, name: "Smoke Админ", status: "active" },
    create: {
      id: ids.adminUser,
      name: "Smoke Админ",
      email: "smoke-admin@example.test",
      status: "active",
    },
  });
  const teacher = await prisma.user.upsert({
    where: { email: "smoke-teacher@example.test" },
    update: { id: ids.teacherUser, name: "Smoke Преподаватель", status: "active" },
    create: {
      id: ids.teacherUser,
      name: "Smoke Преподаватель",
      email: "smoke-teacher@example.test",
      status: "active",
    },
  });
  const studentUser = await prisma.user.upsert({
    where: { email: "smoke-student@example.test" },
    update: { id: ids.studentUser, name: "Smoke Ученик", status: "active" },
    create: {
      id: ids.studentUser,
      name: "Smoke Ученик",
      email: "smoke-student@example.test",
      status: "active",
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: admin.id } },
    update: {
      roles: { set: [Role.admin] },
      permissions: {
        set: [
          Permission.admin_access,
          Permission.courses_write,
          Permission.groups_write,
          Permission.students_write,
          Permission.materials_write,
          Permission.payments_write,
        ],
      },
      status: "active",
    },
    create: {
      organizationId: organization.id,
      userId: admin.id,
      roles: [Role.admin],
      permissions: [
        Permission.admin_access,
        Permission.courses_write,
        Permission.groups_write,
        Permission.students_write,
        Permission.materials_write,
        Permission.payments_write,
      ],
      status: "active",
    },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: teacher.id } },
    update: { roles: { set: [Role.teacher] }, permissions: { set: [] }, status: "active" },
    create: {
      organizationId: organization.id,
      userId: teacher.id,
      roles: [Role.teacher],
      permissions: [],
      status: "active",
    },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: studentUser.id } },
    update: { roles: { set: [Role.student] }, permissions: { set: [] }, status: "active" },
    create: {
      organizationId: organization.id,
      userId: studentUser.id,
      roles: [Role.student],
      permissions: [],
      status: "active",
    },
  });

  const course = await prisma.course.upsert({
    where: { id: ids.course },
    update: {
      organizationId: organization.id,
      name: "Smoke Таджвид",
      description: "Smoke-проверка полного MVP-пути.",
      format: CourseFormat.group,
      lessonMarkScale: LessonMarkScale.five_point,
      status: "active",
      createdById: admin.id,
      archivedAt: null,
    },
    create: {
      id: ids.course,
      organizationId: organization.id,
      name: "Smoke Таджвид",
      description: "Smoke-проверка полного MVP-пути.",
      format: CourseFormat.group,
      lessonMarkScale: LessonMarkScale.five_point,
      status: "active",
      createdById: admin.id,
    },
  });

  await prisma.courseProgressSettings.upsert({
    where: { courseId: course.id },
    update: { name: "Smoke таджвид-прогресс", isProgressEnabled: true },
    create: {
      id: ids.progressSettings,
      courseId: course.id,
      name: "Smoke таджвид-прогресс",
      isProgressEnabled: true,
    },
  });

  const student = await prisma.student.upsert({
    where: { id: ids.student },
    update: {
      organizationId: organization.id,
      userId: studentUser.id,
      name: "Smoke Ученик",
      email: studentUser.email,
      status: "active",
      archivedAt: null,
    },
    create: {
      id: ids.student,
      organizationId: organization.id,
      userId: studentUser.id,
      name: "Smoke Ученик",
      email: studentUser.email,
      status: "active",
    },
  });

  const group = await prisma.group.upsert({
    where: { id: ids.group },
    update: {
      organizationId: organization.id,
      courseId: course.id,
      teacherId: teacher.id,
      name: "Smoke группа",
      status: "active",
      archivedAt: null,
    },
    create: {
      id: ids.group,
      organizationId: organization.id,
      courseId: course.id,
      teacherId: teacher.id,
      name: "Smoke группа",
      status: "active",
    },
  });

  await prisma.groupStudent.upsert({
    where: { groupId_studentId: { groupId: group.id, studentId: student.id } },
    update: { status: "active", leftAt: null },
    create: { groupId: group.id, studentId: student.id, status: "active" },
  });

  const scheduleRule = await prisma.scheduleRule.upsert({
    where: { id: ids.scheduleRule },
    update: {
      organizationId: organization.id,
      targetType: "group",
      targetId: group.id,
      weekday: 0,
      startTime: "10:00",
      endTime: "11:00",
      timezone: "Europe/Moscow",
      startsOn: new Date("2026-05-10T00:00:00.000Z"),
      endsOn: null,
      status: "active",
    },
    create: {
      id: ids.scheduleRule,
      organizationId: organization.id,
      targetType: "group",
      targetId: group.id,
      weekday: 0,
      startTime: "10:00",
      endTime: "11:00",
      timezone: "Europe/Moscow",
      startsOn: new Date("2026-05-10T00:00:00.000Z"),
      status: "active",
    },
  });

  const lesson = await prisma.lesson.upsert({
    where: { id: ids.lesson },
    update: {
      organizationId: organization.id,
      courseId: course.id,
      groupId: group.id,
      teacherId: teacher.id,
      scheduleRuleId: scheduleRule.id,
      scheduledAt: new Date("2026-05-17T07:00:00.000Z"),
      startsAt: new Date("2026-05-17T07:00:00.000Z"),
      endsAt: new Date("2026-05-17T08:00:00.000Z"),
      topic: "Smoke урок",
      summary: "Комментарий к smoke-уроку",
    },
    create: {
      id: ids.lesson,
      organizationId: organization.id,
      courseId: course.id,
      groupId: group.id,
      teacherId: teacher.id,
      scheduleRuleId: scheduleRule.id,
      scheduledAt: new Date("2026-05-17T07:00:00.000Z"),
      startsAt: new Date("2026-05-17T07:00:00.000Z"),
      endsAt: new Date("2026-05-17T08:00:00.000Z"),
      topic: "Smoke урок",
      summary: "Комментарий к smoke-уроку",
    },
  });

  await prisma.journalEntry.upsert({
    where: { lessonId_studentId: { lessonId: lesson.id, studentId: student.id } },
    update: { mark: AttendanceMark.present, score: 5, comment: "Smoke присутствовал" },
    create: {
      id: ids.journalEntry,
      organizationId: organization.id,
      lessonId: lesson.id,
      studentId: student.id,
      mark: AttendanceMark.present,
      score: 5,
      comment: "Smoke присутствовал",
    },
  });

  await prisma.progressRecord.upsert({
    where: { id: ids.progressRecord },
    update: {
      studentId: student.id,
      courseId: course.id,
      lessonId: lesson.id,
      teacherId: teacher.id,
      repeatText: "Повторить ихфа",
      studentComment: "Есть устойчивый прогресс",
      showRules: true,
      showErrors: true,
      showRepeatText: true,
      showStudentComment: true,
    },
    create: {
      id: ids.progressRecord,
      organizationId: organization.id,
      studentId: student.id,
      courseId: course.id,
      lessonId: lesson.id,
      teacherId: teacher.id,
      repeatText: "Повторить ихфа",
      studentComment: "Есть устойчивый прогресс",
      showRules: true,
      showErrors: true,
      showRepeatText: true,
      showStudentComment: true,
    },
  });

  await prisma.studentProgressRule.upsert({
    where: { id: ids.progressRule },
    update: {
      studentId: student.id,
      courseId: course.id,
      name: "Ихфа",
      level: ProgressLevel.good,
      note: "Закрепить на чтении",
      isVisibleToStudent: true,
      isActive: true,
    },
    create: {
      id: ids.progressRule,
      organizationId: organization.id,
      studentId: student.id,
      courseId: course.id,
      name: "Ихфа",
      level: ProgressLevel.good,
      note: "Закрепить на чтении",
      isVisibleToStudent: true,
      isActive: true,
    },
  });

  await prisma.studentProgressError.upsert({
    where: { id: ids.progressError },
    update: {
      studentId: student.id,
      courseId: course.id,
      name: "Поспешность",
      note: "Следить за темпом",
      isRepeated: true,
      isVisibleToStudent: true,
      isActive: true,
    },
    create: {
      id: ids.progressError,
      organizationId: organization.id,
      studentId: student.id,
      courseId: course.id,
      name: "Поспешность",
      note: "Следить за темпом",
      isRepeated: true,
      isVisibleToStudent: true,
      isActive: true,
    },
  });

  const homework = await prisma.homework.upsert({
    where: { id: ids.homework },
    update: {
      courseId: course.id,
      groupId: group.id,
      lessonId: lesson.id,
      studentId: null,
      authorId: teacher.id,
      title: "Smoke домашнее задание",
      text: "Повторить правило ихфа.",
      dueAt: new Date("2026-05-20T00:00:00.000Z"),
      isVisibleToStudent: true,
      status: "active",
      archivedAt: null,
    },
    create: {
      id: ids.homework,
      organizationId: organization.id,
      courseId: course.id,
      groupId: group.id,
      lessonId: lesson.id,
      authorId: teacher.id,
      title: "Smoke домашнее задание",
      text: "Повторить правило ихфа.",
      dueAt: new Date("2026-05-20T00:00:00.000Z"),
      isVisibleToStudent: true,
      status: "active",
    },
  });

  await prisma.material.upsert({
    where: { id: ids.material },
    update: {
      courseId: course.id,
      groupId: group.id,
      lessonId: lesson.id,
      homeworkId: homework.id,
      studentId: null,
      authorId: teacher.id,
      title: "Smoke материал",
      type: MaterialType.link,
      url: "https://example.test/tajweed-smoke",
      description: "Smoke-ссылка для ученика",
      isVisibleToStudent: true,
      status: "active",
      archivedAt: null,
    },
    create: {
      id: ids.material,
      organizationId: organization.id,
      courseId: course.id,
      groupId: group.id,
      lessonId: lesson.id,
      homeworkId: homework.id,
      authorId: teacher.id,
      title: "Smoke материал",
      type: MaterialType.link,
      url: "https://example.test/tajweed-smoke",
      description: "Smoke-ссылка для ученика",
      isVisibleToStudent: true,
      status: "active",
    },
  });

  await prisma.payment.upsert({
    where: { id: ids.payment },
    update: {
      organizationId: organization.id,
      studentId: student.id,
      courseId: course.id,
      groupId: group.id,
      amount: 5000,
      currency: "RUB",
      periodType: PaymentPeriodType.month,
      periodStart: new Date("2026-05-01T00:00:00.000Z"),
      periodEnd: new Date("2026-05-31T00:00:00.000Z"),
      dueAt: new Date("2026-05-25T00:00:00.000Z"),
      paidAt: null,
      status: PaymentStatus.pending,
      comment: "Smoke оплата за май",
      internalComment: null,
      createdById: admin.id,
      updatedById: admin.id,
    },
    create: {
      id: ids.payment,
      organizationId: organization.id,
      studentId: student.id,
      courseId: course.id,
      groupId: group.id,
      amount: 5000,
      currency: "RUB",
      periodType: PaymentPeriodType.month,
      periodStart: new Date("2026-05-01T00:00:00.000Z"),
      periodEnd: new Date("2026-05-31T00:00:00.000Z"),
      dueAt: new Date("2026-05-25T00:00:00.000Z"),
      status: PaymentStatus.pending,
      comment: "Smoke оплата за май",
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  const adminView = await prisma.organization.findFirst({
    where: { id: organization.id },
    include: {
      courses: { where: { id: course.id } },
      groups: { where: { id: group.id } },
      students: { where: { id: student.id } },
      payments: { where: { id: ids.payment } },
    },
  });
  assertSmoke(adminView?.courses.length === 1, "админ видит курс");
  assertSmoke(adminView.groups.length === 1, "админ видит группу");
  assertSmoke(adminView.students.length === 1, "админ видит ученика");
  assertSmoke(adminView.payments.length === 1, "админ видит оплату");

  const teacherView = await prisma.group.findFirst({
    where: { id: group.id, teacherId: teacher.id },
    include: {
      lessons: { where: { id: lesson.id } },
      students: { where: { studentId: student.id, status: "active" } },
    },
  });
  assertSmoke(teacherView, "преподаватель видит назначенную группу");
  assertSmoke(teacherView.lessons.length === 1, "преподаватель видит урок");
  assertSmoke(teacherView.students.length === 1, "преподаватель видит ученика группы");

  const studentView = await prisma.student.findFirst({
    where: { id: student.id },
    include: {
      groupLinks: { where: { groupId: group.id, status: "active" } },
      journalEntries: { where: { lessonId: lesson.id, mark: AttendanceMark.present } },
      progressRecords: { where: { lessonId: lesson.id, showRepeatText: true } },
      progressRules: { where: { courseId: course.id, isVisibleToStudent: true } },
      progressErrors: { where: { courseId: course.id, isVisibleToStudent: true } },
      homeworks: true,
      materials: true,
      payments: { where: { id: ids.payment } },
    },
  });
  assertSmoke(studentView, "ученик создан");
  assertSmoke(studentView.groupLinks.length === 1, "ученик связан с группой");
  assertSmoke(studentView.journalEntries.length === 1, "ученик видит посещаемость");
  assertSmoke(studentView.progressRecords.length === 1, "ученик видит открытую часть прогресса");
  assertSmoke(studentView.progressRules.length === 1, "ученик видит правило прогресса");
  assertSmoke(studentView.progressErrors.length === 1, "ученик видит ошибку прогресса");

  const visibleHomework = await prisma.homework.findFirst({
    where: {
      id: homework.id,
      status: "active",
      isVisibleToStudent: true,
      group: { students: { some: { studentId: student.id, status: "active" } } },
    },
  });
  const visibleMaterial = await prisma.material.findFirst({
    where: {
      id: ids.material,
      status: "active",
      isVisibleToStudent: true,
      group: { students: { some: { studentId: student.id, status: "active" } } },
    },
  });
  assertSmoke(visibleHomework, "ученик видит домашнее задание группы");
  assertSmoke(visibleMaterial, "ученик видит материал-ссылку группы");
  assertSmoke(studentView.payments.length === 1, "ученик видит статус оплаты");

  console.log("MVP smoke passed: admin -> teacher -> student -> payment.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
