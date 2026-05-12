import {
  AttendanceMark,
  AttendanceStatus,
  CourseFormat,
  CourseStatus,
  GroupStatus,
  GroupStudentStatus,
  LessonMarkScale,
  LessonStatus,
  ScheduleRuleStatus,
  StudentStatus,
} from "@prisma/client";

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

export const scheduleRuleStatusLabels: Record<ScheduleRuleStatus, string> = {
  active: "Активное",
  archived: "Архивное",
};

export const lessonStatusLabels: Record<LessonStatus, string> = {
  scheduled: "Запланирован",
  in_progress: "Идет",
  completed: "Завершен",
  cancelled: "Отменен",
  moved: "Перенесен",
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  not_checked: "Не проверена",
  confirmed: "Подтверждена",
};

export const attendanceMarkLabels: Record<AttendanceMark, string> = {
  present: "П",
  absent: "Н",
  excused: "У",
};

export const attendanceMarkFullLabels: Record<AttendanceMark, string> = {
  present: "Присутствовал",
  absent: "Отсутствовал",
  excused: "Уважительная причина",
};

export const weekdayLabels: Record<number, string> = {
  0: "Воскресенье",
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
};
