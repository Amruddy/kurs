import { loginAsAdmin, loginAsPrivateTeacher, loginAsStudent, loginAsTeacher } from "./actions";
import { isDevLoginEnabled } from "@/app/lib/dev-auth";

const errorMessages: Record<string, string> = {
  "dev-login-disabled": "Тестовый вход отключен для рабочего режима.",
  "seed-user-not-found": "Seed-пользователь не найден. Примените миграции и запустите seed.",
  "workspace-unavailable": "Для выбранного пользователя недоступна эта рабочая область.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const showDevLogin = isDevLoginEnabled();
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? "Не удалось выполнить вход. Проверьте доступ и попробуйте снова.")
    : null;

  return (
    <>
      <div className="page-heading">
        <h1>Вход в систему</h1>
      </div>

      <section className="login-workspace">
        <div className="panel login-main-panel">
          <div className="section-heading">
            <h2>Выберите рабочую область</h2>
          </div>

          {errorMessage ? (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {showDevLogin ? (
            <div className="login-grid">
              <form action={loginAsAdmin}>
                <button className="button" type="submit">
                  Войти как админ
                </button>
              </form>
              <form action={loginAsTeacher}>
                <button className="button" type="submit">
                  Войти как преподаватель
                </button>
              </form>
              <form action={loginAsStudent}>
                <button className="button" type="submit">
                  Войти как ученик
                </button>
              </form>
              <form action={loginAsPrivateTeacher}>
                <button className="button" type="submit">
                  Войти как преподаватель-одиночка
                </button>
              </form>
            </div>
          ) : (
            <p className="muted">
              Рабочая сессия уже определяется через Supabase Auth. Форма входа по email и паролю будет подключена на
              следующем этапе.
            </p>
          )}
        </div>

        {showDevLogin ? (
          <aside className="panel login-side-panel">
            <h2>Тестовые пользователи</h2>
            <div className="info-list">
              <div className="info-row">
                <span>Админ</span>
                <strong>admin@example.test</strong>
              </div>
              <div className="info-row">
                <span>Преподаватель</span>
                <strong>teacher@example.test</strong>
              </div>
              <div className="info-row">
                <span>Ученик</span>
                <strong>student@example.test</strong>
              </div>
              <div className="info-row">
                <span>Одиночка</span>
                <strong>solo-teacher@example.test</strong>
              </div>
            </div>
          </aside>
        ) : null}
      </section>
    </>
  );
}
