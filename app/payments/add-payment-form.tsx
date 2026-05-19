"use client";

import { useMemo, useState } from "react";
import { addPayment } from "@/app/payments/actions";
import { PaymentCommonFields, type PaymentFormData } from "@/app/payments/payment-form-fields";

export function AddPaymentForm({ data }: { data: PaymentFormData }) {
  const [targetType, setTargetType] = useState<"group" | "student">("group");
  const [groupId, setGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const studentsInGroup = useMemo(
    () => data.groupStudentOptions.filter((student) => student.groupId === groupId),
    [data.groupStudentOptions, groupId],
  );
  const isStudentTarget = targetType === "student";

  return (
    <form action={addPayment} className="form-grid">
      <label className="full-width-field">
        Кому добавить оплату
        <select
          name="targetType"
          required
          value={targetType}
          onChange={(event) => setTargetType(event.target.value === "student" ? "student" : "group")}
        >
          <option value="group">Всей группе</option>
          <option value="student">Одному ученику</option>
        </select>
      </label>
      <label className={isStudentTarget ? "" : "full-width-field"}>
        Группа
        <select
          name="groupId"
          required
          value={groupId}
          onChange={(event) => {
            setGroupId(event.target.value);
            setStudentId("");
          }}
        >
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
      {isStudentTarget ? (
        <label>
          Ученик
          <select
            name="studentId"
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={!groupId || studentsInGroup.length === 0}
          >
            <option value="" disabled>
              {groupId ? "Выберите ученика" : "Сначала выберите группу"}
            </option>
            {studentsInGroup.map((student) => (
              <option key={`${student.groupId}:${student.value}`} value={student.value}>
                {student.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <PaymentCommonFields data={data} />
      <button className="button" type="submit" disabled={!groupId || (isStudentTarget && !studentId)}>
        Добавить оплату
      </button>
    </form>
  );
}
