import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { CourseFormat, LessonMarkScale, Permission, PrismaClient, Role } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const seedUsers = [
  {
    name: "Администратор",
    email: "admin@example.test",
    roles: [Role.admin],
    permissions: [
      Permission.admin_access,
      Permission.courses_write,
      Permission.groups_write,
      Permission.students_write,
      Permission.materials_write,
      Permission.payments_write,
    ],
  },
  {
    name: "Преподаватель",
    email: "teacher@example.test",
    roles: [Role.teacher],
    permissions: [],
  },
  {
    name: "Ученик",
    email: "student@example.test",
    roles: [Role.student],
    permissions: [],
  },
  {
    name: "Преподаватель-одиночка",
    email: "solo-teacher@example.test",
    roles: [Role.teacher, Role.admin],
    permissions: [
      Permission.admin_access,
      Permission.courses_write,
      Permission.groups_write,
      Permission.students_write,
      Permission.materials_write,
      Permission.payments_write,
    ],
  },
  {
    name: "Пользователь без роли",
    email: "no-role@example.test",
    roles: [],
    permissions: [],
  },
];

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "seed-organization" },
    update: {
      name: "Учебный центр",
      type: "learning_center",
      status: "active",
    },
    create: {
      id: "seed-organization",
      name: "Учебный центр",
      type: "learning_center",
      status: "active",
    },
  });

  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {
        name: seedUser.name,
        status: "active",
      },
      create: {
        name: seedUser.name,
        email: seedUser.email,
        status: "active",
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: {
        roles: { set: seedUser.roles },
        permissions: { set: seedUser.permissions },
        status: "active",
      },
      create: {
        organizationId: organization.id,
        userId: user.id,
        roles: seedUser.roles,
        permissions: seedUser.permissions,
        status: "active",
      },
    });
  }

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@example.test" },
  });
  const teacherUser = await prisma.user.findUniqueOrThrow({
    where: { email: "teacher@example.test" },
  });
  const studentUser = await prisma.user.findUniqueOrThrow({
    where: { email: "student@example.test" },
  });

  const course = await prisma.course.upsert({
    where: { id: "seed-course-tajweed" },
    update: {
      organizationId: organization.id,
      name: "Таджвид для начинающих",
      description: "Базовый курс чтения и правил таджвида.",
      format: CourseFormat.group,
      lessonMarkScale: LessonMarkScale.five_point,
      status: "active",
      createdById: adminUser.id,
    },
    create: {
      id: "seed-course-tajweed",
      organizationId: organization.id,
      name: "Таджвид для начинающих",
      description: "Базовый курс чтения и правил таджвида.",
      format: CourseFormat.group,
      lessonMarkScale: LessonMarkScale.five_point,
      status: "active",
      createdById: adminUser.id,
    },
  });

  await prisma.courseProgressSettings.upsert({
    where: { courseId: course.id },
    update: {
      name: "Таджвид-прогресс",
      isProgressEnabled: true,
    },
    create: {
      courseId: course.id,
      name: "Таджвид-прогресс",
      isProgressEnabled: true,
    },
  });

  const student = await prisma.student.upsert({
    where: { id: "seed-student" },
    update: {
      organizationId: organization.id,
      userId: studentUser.id,
      name: "Ученик",
      email: studentUser.email,
      status: "active",
    },
    create: {
      id: "seed-student",
      organizationId: organization.id,
      userId: studentUser.id,
      name: "Ученик",
      email: studentUser.email,
      status: "active",
    },
  });

  const group = await prisma.group.upsert({
    where: { id: "seed-group" },
    update: {
      organizationId: organization.id,
      courseId: course.id,
      teacherId: teacherUser.id,
      name: "Группа начинающих",
      status: "active",
    },
    create: {
      id: "seed-group",
      organizationId: organization.id,
      courseId: course.id,
      teacherId: teacherUser.id,
      name: "Группа начинающих",
      status: "active",
    },
  });

  await prisma.groupStudent.upsert({
    where: {
      groupId_studentId: {
        groupId: group.id,
        studentId: student.id,
      },
    },
    update: {
      status: "active",
      leftAt: null,
    },
    create: {
      groupId: group.id,
      studentId: student.id,
      status: "active",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
