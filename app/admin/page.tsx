import { WorkspacePage } from "@/app/components/workspace-page";

export default function AdminPage() {
  return (
    <WorkspacePage
      title="Административная область"
      expectedRole="admin"
      description="Базовая страница администратора для Stage 0. Бизнес-действия начнутся на следующих этапах."
      items={[
        "Организация создается seed-скриптом.",
        "Админ получает роль admin и административные права.",
        "CRUD курсов, групп и учеников не входит в Stage 0.",
      ]}
    />
  );
}

