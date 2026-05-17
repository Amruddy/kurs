import { EmptyStatePage } from "@/app/components/empty-state-page";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function TeacherAttendancePage() {
  await requireWorkspace("teacher");

  return <EmptyStatePage title="Посещаемость" />;
}
