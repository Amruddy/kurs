import { CourseFormat, CourseStatus, GroupStatus, GroupStudentStatus, LessonMarkScale, StudentStatus } from "@prisma/client";

export const courseFormatLabels: Record<CourseFormat, string> = {
  group: "Группы",
  individual: "Индивидуально",
  both: "Группы и индивидуально",
};

export const lessonMarkScaleLabels: Record<LessonMarkScale, string> = {
  five_point: "5-балльная",
  ten_point: "10-балльная",
};

export const courseStatusLabels: Record<CourseStatus, string> = {
  active: "Активный",
  archived: "Архивный",
};

export const studentStatusLabels: Record<StudentStatus, string> = {
  active: "Активный",
  paused: "Приостановлен",
  archived: "Архивный",
};

export const groupStatusLabels: Record<GroupStatus, string> = {
  recruiting: "Набор",
  active: "Активная",
  paused: "Приостановлена",
  completed: "Завершена",
  archived: "Архивная",
};

export const groupStudentStatusLabels: Record<GroupStudentStatus, string> = {
  active: "В составе",
  paused: "Пауза",
  removed: "Выбыл",
  completed: "Завершил",
};
