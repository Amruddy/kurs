"use client";

import { paymentStatuses } from "@/app/payments/payment-form-fields";

type PaymentStatusFormProps = {
  action: (formData: FormData) => Promise<void> | void;
  statusValue: string;
};

export function PaymentStatusForm({ action, statusValue }: PaymentStatusFormProps) {
  return (
    <form action={action} className="inline-form payment-inline-action">
      <select
        name="status"
        defaultValue={statusValue}
        aria-label="Статус оплаты"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {paymentStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </form>
  );
}
