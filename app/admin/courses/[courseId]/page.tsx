import Link from "next/link";
import { archiveCourse, updateCourse } from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/app/components/confirm-submit-button";
import { PageCreateAction } from "@/app/components/page-create-action";
import { DataTable, InfoList, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getAdminCourseDetail } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

type AdminCoursePageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

const courseStatuses = [
  { label: "Активен", value: "active" },
  { label: "Архив", value: "archived" },
];

const courseFormats = [
  { label: "Группы", value: "group" },
  { label: "Индивидуально", value: "individual" },
  { label: "Группы и индивидуально", value: "both" },
];

const lessonMarkScales = [
  { label: "5-балльная", value: "five_point" },
  { label: "10-балльная", value: "ten_point" },
];

export default async function AdminCoursePage({ params }: AdminCoursePageProps) {
  const session = await requireWorkspace("admin");
  const { courseId } = await params;
  const result = await getAdminCourseDetail(session.organizationId, courseId);

  return (
    <SupabaseDataPage
      title="Карточка курса"
      description="Административная карточка курса: настройки, группы, ученики, материалы и платежные сигналы."
      result={result}
    >
      {(data) => {
        const updateCourseAction = updateCourse.bind(null, data.id);
        const archiveCourseAction = archiveCourse.bind(null, data.id);

        return (
          <>
            <MetricGrid items={data.metrics} />

            <section className="admin-detail-grid">
              <div className="panel admin-main-panel">
                <div className="section-heading">
                  <div>
                    <h2>{data.name}</h2>
                    <p>
                      {data.type}; {data.format}; {data.status}
                    </p>
                  </div>
                  <PageCreateAction buttonLabel="Изменить курс" title="Изменить курс">
                    <form action={updateCourseAction} className="form-grid">
                      <label>
                        Название
                        <input name="name" required defaultValue={data.name} />
                      </label>
                      <label>
                        Описание
                        <input name="description" defaultValue={data.description} />
                      </label>
                      <label>
                        Формат
                        <select name="format" required defaultValue={data.formatValue}>
                          {courseFormats.map((format) => (
                            <option key={format.value} value={format.value}>
                              {format.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Шкала оценок
                        <select name="lessonMarkScale" required defaultValue={data.lessonMarkScaleValue}>
                          {lessonMarkScales.map((scale) => (
                            <option key={scale.value} value={scale.value}>
                              {scale.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Статус
                        <select name="status" required defaultValue={data.statusValue}>
                          {courseStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="button compact-button" type="submit">
                        Сохранить
                      </button>
                    </form>
                  </PageCreateAction>
                </div>

                <DataTable
                  rows={data.groups}
                  keyForRow={(group) => group.id}
                  emptyText="Группы по этому курсу пока не созданы."
                  columns={[
                    {
                      header: "Группа",
                      render: (group) => (
                        <Link href={`/admin/groups/${group.id}`}>
                          <strong>{group.name}</strong>
                        </Link>
                      ),
                    },
                    { header: "Преподаватель", render: (group) => group.teacher },
                    { header: "Ученики", render: (group) => group.students },
                    { header: "Следующее занятие", render: (group) => group.nextLesson },
                    { header: "Статус", render: (group) => group.status },
                  ]}
                />
              </div>

              <aside className="panel admin-side-panel">
                <h2>Состояние</h2>
                <div className="info-list">
                  <div className="info-row">
                    <span>Прогресс</span>
                    <strong>{data.progressSettings.name}</strong>
                    <p>{data.progressSettings.enabled}</p>
                  </div>
                  <div className="info-row">
                    <span>Шкала</span>
                    <strong>{data.lessonMarkScale}</strong>
                  </div>
                  <div className="info-row">
                    <span>Описание</span>
                    <strong>{data.description || "не заполнено"}</strong>
                  </div>
                </div>
                <div className="button-row">
                  <Link className="secondary-button compact-button" href="/admin/courses">
                    К списку курсов
                  </Link>
                  {data.statusValue !== "archived" ? (
                    <form action={archiveCourseAction} className="inline-form">
                      <ConfirmSubmitButton className="danger-button compact-button" message={`Архивировать курс ${data.name}?`}>
                        Архивировать
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              </aside>
            </section>

            <section className="grid section">
              <div className="panel">
                <h2>Ученики курса</h2>
                <DataTable
                  rows={data.students}
                  keyForRow={(student) => student.id}
                  emptyText="Активных учеников курса пока нет."
                  columns={[
                    {
                      header: "Ученик",
                      render: (student) => (
                        <Link href={`/admin/students/${student.id}`}>
                          <strong>{student.name}</strong>
                        </Link>
                      ),
                    },
                    { header: "Контакты", render: (student) => student.contacts },
                    { header: "Группы", render: (student) => student.groups },
                    { header: "Оплата", render: (student) => student.payment },
                    { header: "Статус", render: (student) => student.status },
                  ]}
                />
              </div>

              <div className="panel">
                <h2>Материалы</h2>
                <InfoList
                  emptyText="Материалы курса пока не добавлены."
                  items={data.materials.map((material) => (
                    <div className="info-row" key={material.id}>
                      <span>{material.detail}</span>
                      <strong>{material.title}</strong>
                    </div>
                  ))}
                />
              </div>

              <div className="panel">
                <h2>Оплаты требуют внимания</h2>
                <InfoList
                  emptyText="Открытых платежных сигналов по курсу нет."
                  items={data.paymentSignals.map((payment) => (
                    <div className="info-row" key={payment.id}>
                      <span>{payment.studentName}</span>
                      <strong>{payment.amount}</strong>
                      <p>
                        {payment.context}; {payment.due}; {payment.status}
                      </p>
                    </div>
                  ))}
                />
              </div>
            </section>
          </>
        );
      }}
    </SupabaseDataPage>
  );
}
