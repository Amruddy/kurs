import type { ReactNode } from "react";
import Link from "next/link";
import { DataTable, MetricGrid, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { PageCreateAction } from "@/app/components/page-create-action";
import { updatePaymentDetails, updatePaymentStatus } from "@/app/payments/actions";
import { AddPaymentForm } from "@/app/payments/add-payment-form";
import { PaymentEditFields, paymentStatuses } from "@/app/payments/payment-form-fields";
import { PaymentStatusForm } from "@/app/payments/payment-status-form";
import { getAdminPayments, type AdminPaymentsData } from "@/app/lib/data/supabase-read";
import { hasPermission, requireWorkspace } from "@/app/lib/dev-auth";

type AdminPaymentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function searchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function searchCount(value: string | string[] | undefined) {
  const raw = searchValue(value);

  if (!raw) {
    return null;
  }

  const count = Number.parseInt(raw, 10);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function PaymentDetailsForm({ payment }: { payment: AdminPaymentsData["payments"][number] }) {
  const action = updatePaymentDetails.bind(null, payment.id);

  return (
    <form action={action} className="form-grid">
      <PaymentEditFields payment={payment} />
      <button className="button" type="submit">
        Сохранить оплату
      </button>
    </form>
  );
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const session = await requireWorkspace("admin");
  const canWritePayments = hasPermission(session, "payments:write");
  const params = searchParams ? await searchParams : {};
  const createdCount = searchCount(params.created) ?? searchCount(params.bulkCreated);
  const skippedCount = searchCount(params.skipped) ?? searchCount(params.bulkSkipped);
  const addResult =
    createdCount === null && skippedCount === null ? null : { created: createdCount ?? 0, skipped: skippedCount ?? 0 };
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
      {(data) => {
        type PaymentRow = (typeof data.payments)[number];
        const paymentColumns: Array<{ header: string; render: (payment: PaymentRow) => ReactNode }> = [
          {
            header: "Ученик",
            render: (payment) => (
              <Link className="table-link" href={`/admin/students/${payment.studentId}`}>
                <strong>{payment.studentName}</strong>
              </Link>
            ),
          },
          {
            header: "Контекст",
            render: (payment) => (
              <div className="payment-cell">
                {payment.contextHref ? (
                  <Link className="table-link" href={payment.contextHref}>
                    <strong>{payment.context}</strong>
                  </Link>
                ) : (
                  <strong>{payment.context}</strong>
                )}
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
        ];

        if (canWritePayments) {
          paymentColumns.push({
            header: "Действие",
            render: (payment) => {
              const action = updatePaymentStatus.bind(null, payment.id);

              return (
                <div className="payment-row-actions">
                  <PageCreateAction buttonLabel="Изменить оплату" title={`Оплата: ${payment.studentName}`}>
                    <PaymentDetailsForm payment={payment} />
                  </PageCreateAction>
                  <PaymentStatusForm action={action} statusValue={payment.statusValue} />
                </div>
              );
            },
          });
        }

        return (
          <>
            <MetricGrid items={data.metrics} />

            <section className="panel section payment-list-panel">
              <div className="section-heading payment-list-heading">
                <div>
                  <h2>Список оплат</h2>
                  <p>Статус меняется вручную. Если срок прошел, это только визуальный сигнал.</p>
                </div>
                <div className="button-row payment-list-actions">
                  <details className="payment-filter-disclosure">
                    <summary className="secondary-button compact-button">Фильтры</summary>
                    <div className="payment-filter-popover">
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
                        <div className="button-row payment-filter-actions">
                          <button className="button" type="submit">
                            Показать
                          </button>
                          <Link className="secondary-button" href="/admin/payments">
                            Сбросить
                          </Link>
                        </div>
                      </form>
                    </div>
                  </details>
                  {canWritePayments ? (
                    <PageCreateAction buttonLabel="Добавить оплату" title="Добавить оплату">
                      <AddPaymentForm data={data} />
                    </PageCreateAction>
                  ) : null}
                </div>
              </div>

              {addResult ? (
                <div className="success-message">
                  Оплата добавлена: создано {addResult.created}, пропущено {addResult.skipped}.
                </div>
              ) : null}

              <DataTable
                rows={data.payments}
                keyForRow={(payment) => payment.id}
                emptyText="Оплаты по выбранным фильтрам не найдены."
                columns={paymentColumns}
              />
            </section>
          </>
        );
      }}
    </SupabaseDataPage>
  );
}
