import { requireWorkspace } from "@/app/lib/dev-auth";

export default async function StudentAttendancePage() {
  await requireWorkspace("student");

  return (
    <>
      <div className="page-heading">
        <h1>Посещаемость</h1>
      </div>

      <section className="student-dashboard">
        <article className="panel student-dashboard-card">
          <h2>Раздел готовится</h2>
          <p>Здесь будет компактная история посещаемости ученика без действий редактирования.</p>
        </article>
      </section>
    </>
  );
}
