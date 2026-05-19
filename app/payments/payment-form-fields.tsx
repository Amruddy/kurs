import type { AdminPaymentsData, PaymentDetailItem } from "@/app/lib/data/supabase-read";

export const paymentStatuses = [
  { label: "Ожидает оплаты", value: "pending" },
  { label: "Оплачено", value: "paid" },
  { label: "Просрочено", value: "overdue" },
  { label: "Льгота", value: "exempt" },
];

export const paymentPeriodTypes = [
  { label: "Месяц", value: "month" },
  { label: "Занятие", value: "lesson" },
  { label: "Курс", value: "course" },
  { label: "Произвольный период", value: "manual" },
];

export type PaymentFormData = Pick<
  AdminPaymentsData,
  "defaultDueAt" | "defaultPeriodEnd" | "defaultPeriodStart" | "groupOptions" | "groupStudentOptions"
>;

export function PaymentCommonFields({ data, includeStatus = true }: { data: PaymentFormData; includeStatus?: boolean }) {
  return (
    <>
      <label>
        Сумма
        <input name="amount" type="number" min="0" step="0.01" required defaultValue="5000" />
      </label>
      <label>
        Валюта
        <input name="currency" required defaultValue="RUB" maxLength={3} />
      </label>
      {includeStatus ? (
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
      ) : null}
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
    </>
  );
}

export function PaymentEditFields({ payment }: { payment: PaymentDetailItem }) {
  return (
    <>
      <label>
        Сумма
        <input name="amount" type="number" min="0" step="0.01" required defaultValue={payment.amountValue} />
      </label>
      <label>
        Валюта
        <input name="currency" required defaultValue={payment.currency} maxLength={3} />
      </label>
      <label>
        Тип периода
        <select name="periodType" required defaultValue={payment.periodTypeValue}>
          {paymentPeriodTypes.map((periodType) => (
            <option key={periodType.value} value={periodType.value}>
              {periodType.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Начало периода
        <input name="periodStart" type="date" defaultValue={payment.periodStart} />
      </label>
      <label>
        Конец периода
        <input name="periodEnd" type="date" defaultValue={payment.periodEnd} />
      </label>
      <label>
        Срок оплаты
        <input name="dueAt" type="date" defaultValue={payment.dueAt} />
      </label>
      <label className="full-width-field">
        Комментарий для ученика
        <textarea name="comment" placeholder="Видно ученику в разделе оплаты" defaultValue={payment.comment} />
      </label>
      <label className="full-width-field">
        Внутренний комментарий
        <textarea name="internalComment" placeholder="Видно только администратору" defaultValue={payment.internalComment} />
      </label>
    </>
  );
}
