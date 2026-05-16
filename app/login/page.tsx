import { loginAsAdmin, loginAsPrivateTeacher, loginAsStudent, loginAsTeacher } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

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

          {params.error ? (
            <div className="error-message" role="alert">
              Seed-пользователь не найден. Примените миграции и запустите seed.
            </div>
          ) : null}

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
        </div>

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
      </section>
    </>
  );
}
