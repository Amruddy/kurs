import Link from "next/link";
import { attendanceMarkFullLabels, attendanceStatusLabels, lessonStatusLabels } from "@/app/lib/learning-labels";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

type TeacherStudentPageProps = {
  params: Promise<{ studentId: string }>;
};

function markText(entry: { mark: "present" | "absent" | "excused" | null; score: number | null } | null) {
  if (!entry) {
    return "Пусто";
  }

  const parts = [];

  if (entry.mark) {
    parts.push(attendanceMarkFullLabels[entry.mark]);
  }

  if (entry.score) {
    parts.push(`оценка ${entry.score}`);
  }

  return parts.join(", ") || "Пусто";
}

export default async function TeacherStudentPage({ params }: TeacherStudentPageProps) {
  const { studentId } = await params;
  const session = await requireWorkspace("teacher");
  const links = await prisma.groupStudent.findMany({
    where: {
      studentId,
      status: "active",
      group: {
        organizationId: session.organizationId,
        teacherId: session.userId,
        status: { not: "archived" },
      },
    },
    include: {
      student: true,
      group: {
        include: { course: true },
      },
    },
  });

  if (links.length === 0) {
    return (
      <section className="panel">
        <h1>Ученик не найден</h1>
        <p>Ученик не входит в ваши активные группы.</p>
      </section>
    );
  }

  const student = links[0].student;
  const groupIds = links.map((link) => link.groupId);
  const lessons = await prisma.lesson.findMany({
    where: {
      organizationId: session.organizationId,
      teacherId: session.userId,
      groupId: { in: groupIds },
      attendanceStatus: "confirmed",
    },
    include: {
      group: true,
      journalEntries: {
        where: { studentId: student.id },
      },
    },
    orderBy: { startsAt: "desc" },
    take: 20,
  });

  return (
    <>
      <div className="page-heading">
        <span className="status">Ученик</span>
        <h1>{student.name}</h1>
        <p>{[student.phone, student.email].filter(Boolean).join(", ") || "Контакты не указаны"}.</p>
      </div>

      <section className="panel">
        <h2>Группы</h2>
        <div className="button-row">
          {links.map((link) => (
            <Link key={link.id} className="secondary-button link-button compact-button" href={`/teacher/groups/${link.group.id}`}>
              {link.group.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="panel section">
        <h2>История посещаемости</h2>
        {lessons.length === 0 ? (
          <p>Подтвержденной посещаемости пока нет.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Группа</th>
                  <th>Урок</th>
                  <th>Посещаемость</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr key={lesson.id}>
                    <td>{lesson.startsAt.toLocaleDateString("ru-RU")}</td>
                    <td>{lesson.group?.name ?? "Группа"}</td>
                    <td>
                      <Link href={`/teacher/lessons/${lesson.id}`}>{lesson.topic || "Открыть урок"}</Link>
                    </td>
                    <td>{markText(lesson.journalEntries[0] ?? null)}</td>
                    <td>
                      {lessonStatusLabels[lesson.lessonStatus]}, {attendanceStatusLabels[lesson.attendanceStatus]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
