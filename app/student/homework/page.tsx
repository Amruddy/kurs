import { EmptyStatePage } from "@/app/components/empty-state-page";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentHomeworkPage() {
  await requireWorkspace("student");

  return <EmptyStatePage title="Домашние задания" />;
}
