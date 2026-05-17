import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <section className="panel system-state">
      <span className="status">Нет доступа</span>
      <h1>Рабочая область недоступна</h1>
      <p>
        Текущий тестовый пользователь не имеет нужной роли или выбрана другая рабочая область.
        Вернитесь ко входу и выберите подходящую роль.
      </p>
      <div className="button-row">
        <Link className="button" href="/login">
          Вернуться ко входу
        </Link>
      </div>
    </section>
  );
}
