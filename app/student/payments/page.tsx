import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentPaymentsPage() {
  await requireWorkspace("student");

  return (
    <>
      <div className="page-heading">
        <h1>Оплата</h1>
      </div>

      <section className="student-dashboard">
        <article className="panel student-dashboard-card">
          <h2>Раздел готовится</h2>
          <p>Здесь будут ближайшие платежи и история оплат ученика в компактном формате.</p>
        </article>
      </section>
    </>
  );
}
