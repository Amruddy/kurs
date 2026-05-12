"use server";

import { AttendanceMark, AttendanceStatus, LessonStatus } from "@prisma/client";
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

function revalidateLessonViews(groupId: string, lessonId: string) {
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher/groups");
  revalidatePath(`/teacher/groups/${groupId}`);
  revalidatePath(`/teacher/groups/${groupId}/journal`);
  revalidatePath(`/teacher/lessons/${lessonId}`);
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

export async function confirmAttendance(lessonId: string) {
  const { lesson } = await requireTeacherLesson(lessonId);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      attendanceStatus: AttendanceStatus.confirmed,
    },
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}

export async function completeLesson(lessonId: string) {
  const { lesson } = await requireTeacherLesson(lessonId);

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      lessonStatus: LessonStatus.completed,
      attendanceStatus: AttendanceStatus.confirmed,
    },
  });

  revalidateLessonViews(lesson.groupId!, lesson.id);
}
