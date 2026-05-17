import { EmptyStatePage } from "@/app/components/empty-state-page";
import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function AdminPaymentsPage() {
  await requireWorkspace("admin");

  return <EmptyStatePage title="Оплаты" />;
}
