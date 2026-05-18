import Link from "next/link";
import { DataTable, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { PageCreateAction } from "@/app/components/page-create-action";
import { createPayment, updatePaymentStatus } from "@/app/payments/actions";
import { getAdminPayments } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

type AdminPaymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const paymentStatuses = [
  { label: "Ожидает оплаты", value: "pending" },
  { label: "Оплачено", value: "paid" },
  { label: "Просрочено", value: "overdue" },
  { label: "Льгота", value: "exempt" },
];

const paymentPeriodTypes = [
  { label: "Месяц", value: "month" },
  { label: "Занятие", value: "lesson" },
  { label: "Курс", value: "course" },
  { label: "Произвольный период", value: "manual" },
];

function searchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const session = await requireWorkspace("admin");
  const params = searchParams ? await searchParams : {};
  const result = await getAdminPayments(session.organizationId, {
    groupId: searchValue(params.groupId),
    period: searchValue(params.period),
    status: searchValue(params.status),
    studentId: searchValue(params.studentId),
  });

  return (
    <SupabaseDataPage
      title="Оплаты"
      description="Ручной учет оплат: создание записей, фильтры и смена статуса без онлайн-платежей."
      result={result}
    >
      {(data) => (
        <>
          <MetricGrid items={data.metrics} />

          <section className="panel section">
            <div className="section-heading">
              <div>
                <h2>Фильтры</h2>
                <p>Сузьте список по ученику, группе, периоду или статусу.</p>
              </div>
              <PageCreateAction buttonLabel="Добавить оплату" title="Новая оплата">
                <form action={createPayment} className="form-grid">
                  <label>
                    Ученик
                    <select name="studentId" required defaultValue="">
                      <option value="" disabled>
                        Выберите ученика
                      </option>
                      {data.studentOptions.map((student) => (
                        <option key={student.value} value={student.value}>
                          {student.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Курс
                    <select name="courseId" required defaultValue="">
                      <option value="" disabled>
                        Выберите курс
                      </option>
                      {data.courseOptions.map((course) => (
                        <option key={course.value} value={course.value}>
                          {course.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Группа
                    <select name="groupId" defaultValue="">
                      <option value="">Без группы</option>
                      {data.groupOptions.map((group) => (
                        <option key={group.value} value={group.value}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Сумма
                    <input name="amount" type="number" min="0" step="0.01" required defaultValue="5000" />
                  </label>
                  <label>
                    Валюта
                    <input name="currency" required defaultValue="RUB" maxLength={3} />
                  </label>
                  <label>
                    Статус
                    <select name="status" required defaultValue="pending">
                      {paymentStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Тип периода
                    <select name="periodType" required defaultValue="month">
                      {paymentPeriodTypes.map((periodType) => (
                        <option key={periodType.value} value={periodType.value}>
                          {periodType.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Начало периода
                    <input name="periodStart" type="date" defaultValue={data.defaultPeriodStart} />
                  </label>
                  <label>
                    Конец периода
                    <input name="periodEnd" type="date" defaultValue={data.defaultPeriodEnd} />
                  </label>
                  <label>
                    Срок оплаты
                    <input name="dueAt" type="date" defaultValue={data.defaultDueAt} />
                  </label>
                  <label className="full-width-field">
                    Комментарий для ученика
                    <textarea name="comment" placeholder="Видно ученику в разделе оплаты" />
                  </label>
                  <label className="full-width-field">
                    Внутренний комментарий
                    <textarea name="internalComment" placeholder="Видно только администратору" />
                  </label>
                  <button className="button" type="submit">
                    Сохранить оплату
                  </button>
                </form>
              </PageCreateAction>
            </div>

            <form className="form-grid payment-filter-form" method="get">
              <label>
                Ученик
                <select name="studentId" defaultValue={data.activeFilters.studentId}>
                  <option value="">Все ученики</option>
                  {data.studentOptions.map((student) => (
                    <option key={student.value} value={student.value}>
                      {student.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Группа
                <select name="groupId" defaultValue={data.activeFilters.groupId}>
                  <option value="">Все группы</option>
                  {data.groupOptions.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Период
                <select name="period" defaultValue={data.activeFilters.period}>
                  <option value="">Все периоды</option>
                  {data.periodOptions.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Статус
                <select name="status" defaultValue={data.activeFilters.status}>
                  <option value="">Все статусы</option>
                  {paymentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="button-row full-width-field">
                <button className="button" type="submit">
                  Показать
                </button>
                <Link className="secondary-button" href="/admin/payments">
                  Сбросить
                </Link>
              </div>
            </form>
          </section>

          <section className="panel section">
            <div className="section-heading">
              <div>
                <h2>Список оплат</h2>
                <p>Статус меняется вручную. Если срок прошел, это только визуальный сигнал.</p>
              </div>
            </div>
            <DataTable
              rows={data.payments}
              keyForRow={(payment) => payment.id}
              emptyText="Оплаты по выбранным фильтрам не найдены."
              columns={[
                { header: "Ученик", render: (payment) => <strong>{payment.studentName}</strong> },
                {
                  header: "Контекст",
                  render: (payment) => (
                    <div className="payment-cell">
                      <strong>{payment.context}</strong>
                      <p>{payment.period}</p>
                      {payment.comment ? <p>Комментарий: {payment.comment}</p> : null}
                      {payment.internalComment ? <p>Внутренне: {payment.internalComment}</p> : null}
                    </div>
                  ),
                },
                { header: "Сумма", render: (payment) => payment.amount },
                { header: "Срок", render: (payment) => payment.due },
                {
                  header: "Статус",
                  render: (payment) => (
                    <span className="payment-status-pill" data-tone={payment.statusTone}>
                      {payment.status}
                    </span>
                  ),
                },
                {
                  header: "Действие",
                  render: (payment) => {
                    const action = updatePaymentStatus.bind(null, payment.id);

                    return (
                      <form action={action} className="inline-form payment-inline-action">
                        <select name="status" defaultValue={payment.statusValue} aria-label="Статус оплаты">
                          {paymentStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                        <button className="secondary-button compact-button" type="submit">
                          Сохранить
                        </button>
                      </form>
                    );
                  },
                },
              ]}
            />
          </section>
        </>
      )}
    </SupabaseDataPage>
  );
}
