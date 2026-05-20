import Link from "next/link";
import {
  archiveStudent,
  assignStudentToGroupFromStudent,
  disableStudentAccess,
  inviteStudentAccess,
  removeStudentFromGroupFromStudent,
  updateStudent,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/app/components/confirm-submit-button";
import { PageCreateAction } from "@/app/components/page-create-action";
import { DataTable, InfoList, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { getAdminStudentDetail, type AdminStudentDetailData } from "@/app/lib/data/supabase-read";
import { hasPermission, requireWorkspace } from "@/app/lib/dev-auth";
import { updateStudentPaymentDetails } from "@/app/payments/actions";
import { PaymentEditFields } from "@/app/payments/payment-form-fields";

type AdminStudentPageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams: Promise<{
    accessError?: string;
    accessMessage?: string;
  }>;
};

const studentStatuses = [
  { label: "Активен", value: "active" },
  { label: "Пауза", value: "paused" },
  { label: "Архив", value: "archived" },
];

const accessMessages: Record<string, string> = {
  access_disabled: "Доступ отключен. Учебная история сохранена.",
  invite_sent: "Приглашение отправлено через Supabase Auth.",
};

const accessErrors: Record<string, string> = {
  disable_failed: "Не удалось отключить доступ. Проверьте Supabase и попробуйте еще раз.",
  invite_failed: "Не удалось отправить приглашение. Проверьте email, Supabase Auth и попробуйте еще раз.",
  supabase_failed: "Supabase Auth не выполнил действие. Проверьте настройки Auth, SMTP и Site URL.",
};

function StudentPaymentDetailsForm({
  payment,
  studentId,
}: {
  payment: AdminStudentDetailData["payments"][number];
  studentId: string;
}) {
  const action = updateStudentPaymentDetails.bind(null, studentId, payment.id);

  return (
    <form action={action} className="form-grid">
      <PaymentEditFields payment={payment} />
      <button className="button" type="submit">
        Сохранить оплату
      </button>
    </form>
  );
}

function StudentAccessAction({ data }: { data: AdminStudentDetailData }) {
  if (data.accessAction === "invite" || data.accessAction === "resend") {
    return (
      <form action={inviteStudentAccess.bind(null, data.id)} className="inline-form">
        <button className="button compact-button" type="submit">
          {data.accessAction === "resend" ? "Отправить повторно" : "Пригласить"}
        </button>
      </form>
    );
  }

  if (data.accessAction === "disable") {
    return (
      <form action={disableStudentAccess.bind(null, data.id)} className="inline-form">
        <ConfirmSubmitButton
          className="danger-button compact-button"
          message={`Отключить доступ ученика ${data.name}? Учебная история сохранится.`}
        >
          Отключить доступ
        </ConfirmSubmitButton>
      </form>
    );
  }

  return null;
}

export default async function AdminStudentPage({ params, searchParams }: AdminStudentPageProps) {
  const session = await requireWorkspace("admin");
  const canWritePayments = hasPermission(session, "payments:write");
  const { studentId } = await params;
  const query = await searchParams;
  const accessMessage = query.accessMessage ? accessMessages[query.accessMessage] : null;
  const accessError = query.accessError ? accessErrors[query.accessError] ?? accessErrors.invite_failed : null;
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
            {accessMessage ? (
              <div className="success-message" role="status">
                {accessMessage}
              </div>
            ) : null}
            {accessError ? (
              <div className="error-message" role="alert">
                {accessError}
              </div>
            ) : null}

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
                  <div className="info-row">
                    <span>Доступ</span>
                    <strong>{data.accessStatus}</strong>
                    <p>{data.accessDetail}</p>
                  </div>
                </div>
                <div className="button-row">
                  <Link className="secondary-button compact-button" href="/admin/students">
                    К списку учеников
                  </Link>
                  <StudentAccessAction data={data} />
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
                      {canWritePayments ? (
                        <PageCreateAction buttonLabel="Изменить оплату" title={`Оплата: ${data.name}`}>
                          <StudentPaymentDetailsForm payment={payment} studentId={data.id} />
                        </PageCreateAction>
                      ) : null}
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
