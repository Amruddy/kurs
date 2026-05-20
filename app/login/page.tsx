import { EntryPage } from "@/app/components/entry-page";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return <EntryPage error={params.error} message={params.message} />;
}
