import { EmptyStatePage } from "@/app/components/empty-state-page";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function TeacherPage() {
  await requireWorkspace("teacher");

  return <EmptyStatePage title="Обзор преподавателя" />;
}
