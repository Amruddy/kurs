type EmptyStatePageProps = {
  title: string;
  description?: string;
};

export function EmptyStatePage({ title, description }: EmptyStatePageProps) {
  return (
    <>
      <div className="page-heading">
        <span className="status">Раздел</span>
        <h1>{title}</h1>
        <p>{description ?? "В этом разделе пока нет данных для текущей рабочей области."}</p>
      </div>

      <section className="panel system-state">
        <h2>Пока пусто</h2>
        <p>Данные появятся здесь после того, как будет заполнен связанный журнал или создана нужная запись.</p>
      </section>
    </>
  );
}
