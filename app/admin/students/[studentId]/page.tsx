import Link from "next/link";
import {
  archiveStudent,
  assignStudentToGroupFromStudent,
  removeStudentFromGroupFromStudent,
  updateStudent,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/app/components/confirm-submit-button";
import { PageCreateAction } from "@/app/components/page-create-action";
import { DataTable, InfoList, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getAdminStudentDetail } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

type AdminStudentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

const studentStatuses = [
  { label: "Активен", value: "active" },
  { label: "Пауза", value: "paused" },
  { label: "Архив", value: "archived" },
];

export default async function AdminStudentPage({ params }: AdminStudentPageProps) {
  const session = await requireWorkspace("admin");
  const { studentId } = await params;
  const result = await getAdminStudentDetail(session.organizationId, studentId);

  return (
    <SupabaseDataPage
      title="Карточка ученика"
      description="Административная карточка ученика: группы, учебная история, прогресс, материалы и оплаты."
      result={result}
    >
      {(data) => {
        const updateStudentAction = updateStudent.bind(null, data.id);
        const archiveStudentAction = archiveStudent.bind(null, data.id);
        const assignGroupAction = assignStudentToGroupFromStudent.bind(null, data.id);

        return (
          <>
            <MetricGrid items={data.metrics} />

            <section className="admin-detail-grid">
              <div className="panel admin-main-panel">
                <div className="section-heading">
                  <div>
                    <h2>{data.name}</h2>
                    <p>
                      {data.contacts}; {data.status}
                    </p>
                  </div>
                  <div className="button-row">
                    <PageCreateAction buttonLabel="Изменить ученика" title="Изменить ученика">
                      <form action={updateStudentAction} className="form-grid">
                        <label>
                          Имя
                          <input name="name" required defaultValue={data.name} />
                        </label>
                        <label>
                          Телефон
                          <input name="phone" defaultValue={data.phone} />
                        </label>
                        <label>
                          Email
                          <input name="email" type="email" defaultValue={data.email} />
                        </label>
                        <label>
                          Статус
                          <select name="status" required defaultValue={data.statusValue}>
                            {studentStatuses.map((status) => (
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

                    <PageCreateAction buttonLabel="Назначить в группу" title="Назначить ученика в группу">
                      {data.groupOptions.length > 0 ? (
                        <form action={assignGroupAction} className="form-grid">
                          <label>
                            Группа
                            <select name="groupId" required defaultValue="">
                              <option value="" disabled>
                                Выберите группу
                              </option>
                              {data.groupOptions.map((group) => (
                                <option key={group.value} value={group.value}>
                                  {group.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button className="button compact-button" type="submit">
                            Назначить
                          </button>
                        </form>
                      ) : (
                        <p className="empty-state">Нет доступных активных групп для назначения.</p>
                      )}
                    </PageCreateAction>
                  </div>
                </div>

                <DataTable
                  rows={data.groups}
                  keyForRow={(group) => group.groupStudentId}
                  emptyText="У ученика пока нет связей с группами."
                  columns={[
                    {
                      header: "Группа",
                      render: (group) => (
                        <Link href={`/admin/groups/${group.groupId}`}>
                          <strong>{group.name}</strong>
                        </Link>
                      ),
                    },
                    { header: "Курс", render: (group) => group.course },
                    { header: "Преподаватель", render: (group) => group.teacher },
                    { header: "Добавлен", render: (group) => group.joinedAt },
                    { header: "Статус", render: (group) => group.status },
                    {
                      header: "Действие",
                      render: (group) =>
                        group.statusValue === "active" ? (
                          <form
                            action={removeStudentFromGroupFromStudent.bind(
                              null,
                              group.groupStudentId,
                              group.groupId,
                              data.id,
                            )}
                            className="inline-form"
                          >
                            <ConfirmSubmitButton
                              className="secondary-button compact-button"
                              message={`Убрать ${data.name} из группы ${group.name}? История сохранится.`}
                            >
                              Убрать
                            </ConfirmSubmitButton>
                          </form>
                        ) : (
                          group.leftAt
                        ),
                    },
                  ]}
                />
              </div>

              <aside className="panel admin-side-panel">
                <h2>Состояние</h2>
                <div className="info-list">
                  <div className="info-row">
                    <span>Статус</span>
                    <strong>{data.status}</strong>
                  </div>
                  <div className="info-row">
                    <span>Телефон</span>
                    <strong>{data.phone || "не заполнен"}</strong>
                  </div>
                  <div className="info-row">
                    <span>Email</span>
                    <strong>{data.email || "не заполнен"}</strong>
                  </div>
                </div>
                <div className="button-row">
                  <Link className="secondary-button compact-button" href="/admin/students">
                    К списку учеников
                  </Link>
                  {data.statusValue !== "archived" ? (
                    <form action={archiveStudentAction} className="inline-form">
                      <ConfirmSubmitButton className="danger-button compact-button" message={`Архивировать ученика ${data.name}?`}>
                        Архивировать
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              </aside>
            </section>

            <section className="grid section">
              <div className="panel">
                <h2>Учебная история</h2>
                <InfoList
                  emptyText="Уроки ученика пока не найдены."
                  items={data.lessons.map((lesson) => (
                    <div className="info-row" key={lesson.id}>
                      <span>{lesson.when}</span>
                      <strong>{lesson.lesson}</strong>
                      <p>
                        {lesson.context}; {lesson.attendance}
                        {lesson.comment ? `; ${lesson.comment}` : ""}
                      </p>
                    </div>
                  ))}
                />
              </div>

              <div className="panel">
                <h2>Прогресс</h2>
                <InfoList
                  emptyText="Правила прогресса пока не настроены."
                  items={data.rules.map((rule) => (
                    <div className="info-row" key={rule.id}>
                      <span>{rule.course}</span>
                      <strong>{rule.name}</strong>
                      <p>
                        {rule.level}; {rule.isActive ? "активно" : "выключено"}
                      </p>
                    </div>
                  ))}
                />
              </div>

              <div className="panel">
                <h2>Ошибки и записи</h2>
                <InfoList
                  emptyText="Ошибок и записей прогресса пока нет."
                  items={[...data.errors, ...data.records].slice(0, 8).map((item) => (
                    <div className="info-row" key={item.id}>
                      <span>{"createdAt" in item ? item.createdAt : item.course}</span>
                      <strong>{"repeatNote" in item ? item.repeatNote || item.lesson : item.name}</strong>
                      <p>{"note" in item ? item.note : item.studentComment || item.internalComment}</p>
                    </div>
                  ))}
                />
              </div>

              <div className="panel">
                <h2>Задания</h2>
                <InfoList
                  emptyText="Домашние задания пока не найдены."
                  items={data.homework.map((homework) => (
                    <div className="info-row" key={homework.id}>
                      <span>{homework.due}</span>
                      <strong>{homework.title}</strong>
                      <p>{homework.description}</p>
                    </div>
                  ))}
                />
              </div>

              <div className="panel">
                <h2>Материалы</h2>
                <InfoList
                  emptyText="Материалы ученика пока не найдены."
                  items={data.materials.map((material) => (
                    <div className="info-row" key={material.id}>
                      <span>{material.detail}</span>
                      <strong>{material.title}</strong>
                    </div>
                  ))}
                />
              </div>

              <div className="panel">
                <h2>Оплаты</h2>
                <InfoList
                  emptyText="Оплаты ученика пока не заведены."
                  items={data.payments.map((payment) => (
                    <div className="info-row" key={payment.id}>
                      <span>{payment.context}</span>
                      <strong>{payment.amount}</strong>
                      <p>
                        {payment.due}; {payment.status}
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
