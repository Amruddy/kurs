import { EmptyStatePage } from "@/app/components/empty-state-page";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function TeacherLessonPage() {
  await requireWorkspace("teacher");

  return <EmptyStatePage title="Занятие" />;
}
