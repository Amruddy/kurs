import { getDevSession } from "@/app/lib/dev-auth";

type WorkspacePageProps = {
  title: string;
  expectedRole: "admin" | "teacher" | "student";
  description: string;
  items: string[];
};

export async function WorkspacePage({
  title,
  expectedRole,
  description,
  items,
}: WorkspacePageProps) {
  const session = await getDevSession();
  const hasAccess = session?.role === expectedRole;

  return (
    <>
      <div className="page-heading">
        <span className="status">{hasAccess ? "Доступ открыт" : "Пустое состояние"}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <section className="grid">
        <div className="panel">
          <h2>Текущий вход</h2>
          <p>{session ? `${session.label}: ${session.email}` : "Пользователь не выбран."}</p>
        </div>
        <div className="panel">
          <h2>Stage 0</h2>
          <p>Страница открывается и готова к подключению следующих данных MVP.</p>
        </div>
        <div className="panel">
          <h2>Дальше</h2>
          <p>Защита маршрутов и полноценная ролевая маршрутизация относятся к Stage 1.</p>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Минимальная рабочая область</h2>
        <ul className="muted-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}

