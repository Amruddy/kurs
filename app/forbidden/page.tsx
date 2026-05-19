import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <section className="panel system-state">
      <span className="status">Нет доступа</span>
      <h1>Раздел недоступен</h1>
      <p>
        У текущего пользователя нет прав на эту рабочую область или выбран другой режим входа. Вернитесь на страницу
        входа и выберите подходящую роль.
      </p>
      <div className="button-row">
        <Link className="button" href="/login">
          Выбрать роль
        </Link>
        <Link className="secondary-button" href="/">
          На главную
        </Link>
      </div>
    </section>
  );
}
