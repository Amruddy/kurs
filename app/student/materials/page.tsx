import { EmptyStatePage } from "@/app/components/empty-state-page";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentMaterialsPage() {
  await requireWorkspace("student");

  return <EmptyStatePage title="Материалы" />;
}
