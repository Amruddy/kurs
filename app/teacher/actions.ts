"use server";

import { AttendanceMark, LessonStatus, MaterialType, ProgressLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/app/lib/dev-auth";
import { prisma } from "@/app/lib/prisma";

function readOptionalText(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function readAttendanceMark(formData: FormData, studentId: string) {
  const value = formData.get(`mark-${studentId}`);

  if (value === AttendanceMark.present || value === AttendanceMark.absent || value === AttendanceMark.excused) {
    return value;
  }

  return null;
}

function readRequiredText(formData: FormData, name: string, message: string) {
  const value = readOptionalText(formData, name);

  if (!value) {
    throw new Error(message);
  }

  return value;
}

function readOptionalDate(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function readVisibility(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function readProgressLevel(formData: FormData) {
  const value = formData.get("level");

  if (
    value === ProgressLevel.excellent ||
    value === ProgressLevel.good ||
    value === ProgressLevel.satisfactory ||
    value === ProgressLevel.poor
  ) {
    return value;
  }

  return null;
}

function readSimpleMaterial(formData: FormData) {
  const value = readRequiredText(formData, "material", "Укажите текст или ссылку.");
  const isLink = /^https?:\/\/\S+$/i.test(value);

  if (isLink) {
    let title = value;

    try {
      title = new URL(value).hostname;
    } catch {
      title = value;
    }

    return {
      title,
      type: MaterialType.link,
      content: null,
      url: value,
    };
  }

  return {
    title: value.length > 60 ? `${value.slice(0, 57)}...` : value,
    type: MaterialType.text,
    content: value,
    url: null,
  };
}

function readScore(formData: FormData, studentId: string, maxScore: number | null) {
  const value = formData.get(`score-${studentId}`);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const score = Number(value);

  if (!Number.isInteger(score) || score < 1 || (maxScore && score > maxScore)) {
    throw new Error("Неверная оценка за урок.");
  }

  return score;
}

function parseJournalCell(value: string, maxScore: number | null) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "") {
    return { mark: null, score: null };
  }

  if (["б", "был", "п", "+", "present"].includes(normalized)) {
    return { mark: AttendanceMark.present, score: null };
  }

  if (["н", "не был", "нет", "-", "absent"].includes(normalized)) {
    return { mark: AttendanceMark.absent, score: null };
  }

  if (["у", "ув", "уваж", "excused"].includes(normalized)) {
    return { mark: AttendanceMark.excused, score: null };
  }

  const score = Number(normalized);

  if (Number.isInteger(score) && score >= 1 && (!maxScore || score <= maxScore)) {
    return { mark: AttendanceMark.present, score };
  }

  throw new Error("В журнал можно вводить только оценку или статус: Б, Н, У.");
}

async function requireTeacherLesson(lessonId: string) {
  const session = await requireWorkspace("teacher");
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      organizationId: session.organizationId,
      teacherId: session.userId,
    },
    include: {
      course: true,
      group: {
        include: {
          students: {
            where: { status: "active" },
            include: { student: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
  });

  if (!lesson || !lesson.group) {
    notFound();
  }

  return { session, lesson };
}

async function requireTeacherStudent(studentId: string) {
  const session = await requireWorkspace("teacher");
  const link = await prisma.groupStudent.findFirst({
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
    orderBy: { joinedAt: "asc" },
  });

  if (!link) {
    notFound();
  }

  return { session, link };
}

async function requireTeacherGroup(groupId: string) {
  const session = await requireWorkspace("teacher");
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      teacherId: session.userId,
      status: { not: "archived" },
    },
    include: { course: true },
  });

  if (!group) {
    notFound();
  }

  return { session, group };
}

function revalidateLessonViews(groupId: string, lessonId: string) {
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher/groups");
  revalidatePath(`/teacher/groups/${groupId}`);
  revalidatePath(`/teacher/groups/${groupId}/journal`);
  revalidatePath(`/teacher/lessons/${lessonId}`);
  revalidatePath("/teacher/homework");
  revalidatePath("/teacher/materials");
  revalidatePath("/student");
  revalidatePath("/student/homework");
  revalidatePath("/student/materials");
  revalidatePath("/student/progress");
}

function revalidateStudentViews(studentId: string) {
  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath("/teacher/students");
  revalidatePath("/student");
  revalidatePath("/student/progress");
  revalidatePath("/student/homework");
  revalidatePath("/student/materials");
}

export async function startLesson(lessonId: string) {
  const { lesson } = await requireTeacherLesson(lessonId);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      lessonStatus: LessonStatus.in_progress,
    },
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function saveLessonJournal(lessonId: string, formData: FormData) {
  const { session, lesson } = await requireTeacherLesson(lessonId);
  const topic = readOptionalText(formData, "topic");
  const summary = readOptionalText(formData, "summary");
  const maxScore =
    lesson.course.lessonMarkScale === "five_point" ? 5 : lesson.course.lessonMarkScale === "ten_point" ? 10 : null;

  await prisma.$transaction(async (tx) => {
    await tx.lesson.update({
      where: { id: lesson.id },
      data: { topic, summary },
    });

    for (const link of lesson.group!.students) {
      const mark = readAttendanceMark(formData, link.studentId);
      const score = readScore(formData, link.studentId, maxScore);
      const comment = readOptionalText(formData, `comment-${link.studentId}`);

      if (!mark && score === null && !comment) {
        await tx.journalEntry.deleteMany({
          where: {
            lessonId: lesson.id,
            studentId: link.studentId,
          },
        });
        continue;
      }

      await tx.journalEntry.upsert({
        where: {
          lessonId_studentId: {
            lessonId: lesson.id,
            studentId: link.studentId,
          },
        },
        update: { mark, score, comment },
        create: {
          organizationId: session.organizationId,
          lessonId: lesson.id,
          studentId: link.studentId,
          mark,
          score,
          comment,
        },
      });
    }
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function saveLessonDetails(lessonId: string, formData: FormData) {
  const { lesson } = await requireTeacherLesson(lessonId);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      topic: readOptionalText(formData, "topic"),
      summary: readOptionalText(formData, "summary"),
    },
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function saveGroupJournal(groupId: string, formData: FormData) {
  const session = await requireWorkspace("teacher");
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      organizationId: session.organizationId,
      teacherId: session.userId,
      status: { not: "archived" },
    },
    include: {
      course: true,
      students: {
        where: { status: "active" },
        orderBy: { joinedAt: "asc" },
      },
      lessons: {
        where: {
          lessonStatus: { notIn: ["cancelled", "moved"] },
        },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const maxScore =
    group.course.lessonMarkScale === "five_point" ? 5 : group.course.lessonMarkScale === "ten_point" ? 10 : null;

  await prisma.$transaction(async (tx) => {
    for (const lesson of group.lessons) {
      for (const link of group.students) {
        const rawValue = formData.get(`cell-${lesson.id}-${link.studentId}`);
        const value = typeof rawValue === "string" ? rawValue : "";
        const parsed = parseJournalCell(value, maxScore);

        if (!parsed.mark && parsed.score === null) {
          await tx.journalEntry.deleteMany({
            where: {
              lessonId: lesson.id,
              studentId: link.studentId,
            },
          });
          continue;
        }

        await tx.journalEntry.upsert({
          where: {
            lessonId_studentId: {
              lessonId: lesson.id,
              studentId: link.studentId,
            },
          },
          update: {
            mark: parsed.mark,
            score: parsed.score,
          },
          create: {
            organizationId: session.organizationId,
            lessonId: lesson.id,
            studentId: link.studentId,
            mark: parsed.mark,
            score: parsed.score,
          },
        });
      }
    }
  });

  revalidatePath(`/teacher/groups/${group.id}/journal`);
  revalidatePath(`/teacher/groups/${group.id}`);
  revalidatePath("/teacher/attendance");
}

export async function completeLesson(lessonId: string) {
  const { lesson } = await requireTeacherLesson(lessonId);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      lessonStatus: LessonStatus.completed,
    },
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function createProgressRule(studentId: string, formData: FormData) {
  const { session, link } = await requireTeacherStudent(studentId);

  await prisma.studentProgressRule.create({
    data: {
      organizationId: session.organizationId,
      studentId,
      courseId: link.group.courseId,
      name: readRequiredText(formData, "name", "Укажите правило."),
      level: readProgressLevel(formData),
      note: readOptionalText(formData, "note"),
      isVisibleToStudent: readVisibility(formData, "isVisibleToStudent"),
    },
  });

  revalidateStudentViews(studentId);
}

export async function createProgressError(studentId: string, formData: FormData) {
  const { session, link } = await requireTeacherStudent(studentId);

  await prisma.studentProgressError.create({
    data: {
      organizationId: session.organizationId,
      studentId,
      courseId: link.group.courseId,
      name: readRequiredText(formData, "name", "Укажите ошибку."),
      note: readOptionalText(formData, "note"),
      isRepeated: readVisibility(formData, "isRepeated"),
      isVisibleToStudent: readVisibility(formData, "isVisibleToStudent"),
    },
  });

  revalidateStudentViews(studentId);
}

export async function createProgressRecord(studentId: string, lessonId: string | null, formData: FormData) {
  const { session, link } = await requireTeacherStudent(studentId);

  await prisma.progressRecord.create({
    data: {
      organizationId: session.organizationId,
      studentId,
      courseId: link.group.courseId,
      lessonId,
      teacherId: session.userId,
      repeatText: readOptionalText(formData, "repeatText"),
      studentComment: readOptionalText(formData, "studentComment"),
      internalComment: readOptionalText(formData, "internalComment"),
      showRules: readVisibility(formData, "showRules"),
      showErrors: readVisibility(formData, "showErrors"),
      showRepeatText: readVisibility(formData, "showRepeatText"),
      showStudentComment: readVisibility(formData, "showStudentComment"),
    },
  });

  revalidateStudentViews(studentId);
  if (lessonId) {
    revalidatePath(`/teacher/lessons/${lessonId}`);
  }
}

export async function createLessonProgress(lessonId: string, formData: FormData) {
  const studentId = readRequiredText(formData, "studentId", "Р’С‹Р±РµСЂРёС‚Рµ СѓС‡РµРЅРёРєР°.");
  const { session, lesson } = await requireTeacherLesson(lessonId);
  const hasStudent = lesson.group!.students.some((link) => link.studentId === studentId);

  if (!hasStudent) {
    notFound();
  }

  await prisma.progressRecord.create({
    data: {
      organizationId: session.organizationId,
      studentId,
      courseId: lesson.courseId,
      lessonId: lesson.id,
      teacherId: session.userId,
      repeatText: readOptionalText(formData, "repeatText"),
      studentComment: readOptionalText(formData, "studentComment"),
      internalComment: readOptionalText(formData, "internalComment"),
      showRules: readVisibility(formData, "showRules"),
      showErrors: readVisibility(formData, "showErrors"),
      showRepeatText: readVisibility(formData, "showRepeatText"),
      showStudentComment: readVisibility(formData, "showStudentComment"),
    },
  });

  revalidateStudentViews(studentId);
  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function createLessonHomework(lessonId: string, formData: FormData) {
  const { session, lesson } = await requireTeacherLesson(lessonId);
  const studentId = readOptionalText(formData, "studentId");

  await prisma.homework.create({
    data: {
      organizationId: session.organizationId,
      courseId: lesson.courseId,
      groupId: lesson.groupId,
      lessonId: lesson.id,
      studentId,
      authorId: session.userId,
      title: readRequiredText(formData, "title", "Укажите название задания."),
      text: readRequiredText(formData, "text", "Укажите текст задания."),
      dueAt: readOptionalDate(formData, "dueAt"),
      isVisibleToStudent: readVisibility(formData, "isVisibleToStudent"),
    },
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function createGroupHomework(groupId: string, formData: FormData) {
  const { session, group } = await requireTeacherGroup(groupId);
  const studentId = readOptionalText(formData, "studentId");

  await prisma.homework.create({
    data: {
      organizationId: session.organizationId,
      courseId: group.courseId,
      groupId: group.id,
      studentId,
      authorId: session.userId,
      title: readRequiredText(formData, "title", "Укажите название задания."),
      text: readRequiredText(formData, "text", "Укажите текст задания."),
      dueAt: readOptionalDate(formData, "dueAt"),
      isVisibleToStudent: readVisibility(formData, "isVisibleToStudent"),
    },
  });

  revalidatePath("/teacher/homework");
  revalidatePath(`/teacher/groups/${group.id}`);
  revalidatePath("/student/homework");
}

export async function createTeacherHomework(formData: FormData) {
  const groupId = readRequiredText(formData, "groupId", "Выберите группу.");
  await createGroupHomework(groupId, formData);
}

export async function createLessonMaterial(lessonId: string, formData: FormData) {
  const { session, lesson } = await requireTeacherLesson(lessonId);
  const simpleMaterial = readSimpleMaterial(formData);

  await prisma.material.create({
    data: {
      organizationId: session.organizationId,
      courseId: lesson.courseId,
      groupId: lesson.groupId,
      lessonId: lesson.id,
      authorId: session.userId,
      title: simpleMaterial.title,
      type: simpleMaterial.type,
      content: simpleMaterial.content,
      url: simpleMaterial.url,
      description: null,
      isVisibleToStudent: readVisibility(formData, "isVisibleToStudent"),
    },
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function createGroupMaterial(groupId: string, formData: FormData) {
  const { session, group } = await requireTeacherGroup(groupId);
  const simpleMaterial = readSimpleMaterial(formData);

  await prisma.material.create({
    data: {
      organizationId: session.organizationId,
      courseId: group.courseId,
      groupId: group.id,
      authorId: session.userId,
      title: simpleMaterial.title,
      type: simpleMaterial.type,
      content: simpleMaterial.content,
      url: simpleMaterial.url,
      description: null,
      isVisibleToStudent: readVisibility(formData, "isVisibleToStudent"),
    },
  });

  revalidatePath("/teacher/materials");
  revalidatePath(`/teacher/groups/${group.id}`);
  revalidatePath("/student/materials");
}

export async function createTeacherMaterial(formData: FormData) {
  const groupId = readRequiredText(formData, "groupId", "Выберите группу.");
  await createGroupMaterial(groupId, formData);
}
