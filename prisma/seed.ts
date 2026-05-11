import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, Permission } from "@prisma/client";

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
