"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="panel system-state">
      <span className="status">Ошибка</span>
      <h1>Что-то пошло не так</h1>
      <p>Попробуйте повторить действие. Если ошибка останется, нужно проверить журнал приложения.</p>
      <div className="button-row">
        <button className="button" type="button" onClick={reset}>
          Повторить
        </button>
      </div>
    </section>
  );
}
