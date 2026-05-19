import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel system-state">
      <span className="status">Не найдено</span>
      <h1>Страница недоступна</h1>
      <p>Такой страницы нет, запись удалена или она не относится к текущей рабочей области.</p>
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
