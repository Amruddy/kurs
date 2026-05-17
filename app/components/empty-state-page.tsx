type EmptyStatePageProps = {
  title: string;
  description?: string;
};

export function EmptyStatePage({ title, description }: EmptyStatePageProps) {
  return (
    <>
      <div className="page-heading">
        <span className="status">Временный режим</span>
        <h1>{title}</h1>
        <p>
          {description ??
            "Слой базы данных удален. Раздел сохранен как маршрут, но данные и действия будут добавлены заново после утверждения новой схемы."}
        </p>
      </div>

      <section className="panel system-state">
        <h2>Данных пока нет</h2>
        <p>
          Старая локальная база, миграции, seed и runtime-доступ к данным больше не используются.
          Следующий шаг - спроектировать чистое подключение Supabase без переноса старых данных.
        </p>
      </section>
    </>
  );
}
