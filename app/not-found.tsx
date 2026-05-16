import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel system-state">
      <span className="status">Не найдено</span>
      <h1>Страница не найдена</h1>
      <p>Такой страницы нет или она недоступна в текущей рабочей области.</p>
      <div className="button-row">
        <Link className="button" href="/login">
          Вернуться ко входу
        </Link>
      </div>
    </section>
  );
}
