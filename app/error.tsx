"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="panel system-state">
      <span className="status">Ошибка</span>
      <h1>Раздел не загрузился</h1>
      <p>Повторите действие. Если ошибка останется, нужно проверить данные раздела и подключение Supabase.</p>
      <div className="button-row">
        <button className="button" type="button" onClick={reset}>
          Повторить
        </button>
        <Link className="secondary-button" href="/">
          На главную
        </Link>
      </div>
    </section>
  );
}
