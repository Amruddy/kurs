import Link from "next/link";

export default function NotFound() {
  return (
    <section className="panel">
      <div className="page-heading">
        <span className="status">Не найдено</span>
        <h1>Страница не найдена</h1>
        <p>Такой страницы нет или она недоступна в текущей рабочей области.</p>
      </div>
      <Link className="button" href="/login">
        Вернуться ко входу
      </Link>
    </section>
  );
}

