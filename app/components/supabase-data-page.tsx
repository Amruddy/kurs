import type { ReactNode } from "react";
import type { DataResult, MetricItem } from "@/app/lib/data/supabase-read";

type SupabaseDataPageProps<T> = {
  title: string;
  description: string;
  result: DataResult<T>;
  children: (data: T) => ReactNode;
};

type TableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

export function SupabaseDataPage<T>({ title, description, result, children }: SupabaseDataPageProps<T>) {
  return (
    <>
      <div className="page-heading">
        <span className="status">{result.state === "ready" ? "Supabase" : "Настройка"}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {result.state === "setup" ? <SupabaseSetupPanel missingEnv={result.missingEnv} /> : null}
      {result.state === "error" ? <SupabaseErrorPanel message={result.message} /> : null}
      {result.state === "ready" ? children(result.data) : null}
    </>
  );
}

function SupabaseSetupPanel({ missingEnv }: { missingEnv: string[] }) {
  return (
    <section className="panel system-state">
      <h2>Supabase еще не настроен локально</h2>
      <p>
        Добавьте переменные в `.env.local`, примените SQL из папки `supabase/` в dev-проекте и
        перезапустите `npm run dev`.
      </p>
      <ul className="muted-list">
        {missingEnv.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}

function SupabaseErrorPanel({ message }: { message: string }) {
  return (
    <section className="panel system-state">
      <h2>Не удалось прочитать данные Supabase</h2>
      <p>{message}</p>
    </section>
  );
}

export function MetricGrid({ items }: { items: MetricItem[] }) {
  return (
    <section className="metric-grid">
      {items.map((item) => (
        <div className="panel metric-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail ? <p>{item.detail}</p> : null}
        </div>
      ))}
    </section>
  );
}

export function InfoList({ emptyText, items }: { emptyText: string; items: ReactNode[] }) {
  if (items.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return <div className="info-list">{items}</div>;
}

export function DataTable<T>({
  columns,
  emptyText,
  keyForRow,
  rows,
}: {
  columns: TableColumn<T>[];
  emptyText: string;
  keyForRow: (row: T) => string;
  rows: T[];
}) {
  if (rows.length === 0) {
    return <p className="empty-state">{emptyText}</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyForRow(row)}>
              {columns.map((column) => (
                <td key={column.header}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

