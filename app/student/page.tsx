import { WorkspacePage } from "@/app/components/workspace-page";

export default function StudentPage() {
  return (
    <WorkspacePage
      title="Кабинет ученика"
      expectedRole="student"
      description="Базовая страница ученика для Stage 0. Учебные данные появятся после реализации групп, расписания и уроков."
      items={[
        "Ученик создается seed-скриптом.",
        "Пользователь получает роль student.",
        "Домашние задания, материалы и посещаемость не входят в Stage 0.",
      ]}
    />
  );
}

