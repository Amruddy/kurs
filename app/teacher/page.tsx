import { WorkspacePage } from "@/app/components/workspace-page";

export default function TeacherPage() {
  return (
    <WorkspacePage
      title="Рабочая область преподавателя"
      expectedRole="teacher"
      description="Защищенная рабочая область преподавателя. Журнал, группы и уроки будут добавлены по плану MVP."
      items={[
        "Преподаватель создается seed-скриптом.",
        "Пользователь получает роль teacher.",
        "Группы, уроки и журнал не входят в Stage 0.",
      ]}
    />
  );
}
