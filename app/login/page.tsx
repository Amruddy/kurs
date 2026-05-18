import { EntryPage } from "@/app/components/entry-page";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return <EntryPage error={params.error} />;
}
