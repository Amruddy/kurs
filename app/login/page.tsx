import { loginAsAdmin, loginAsStudent, loginAsTeacher } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <div className="page-heading">
        <span className="status">Dev-вход</span>
        <h1>Вход в систему</h1>
        <p>
          На этом этапе используется тестовый вход без регистрации и пароля.
          Пользователь выбирается кнопкой для ручной проверки рабочих областей.
        </p>
      </div>

      {params.error ? (
        <div className="error-message">
          Seed-пользователь не найден. Примените миграции и запустите seed.
        </div>
      ) : null}

      <section className="panel">
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
        </div>
        <ul className="muted-list">
          <li>Админ: admin@example.test</li>
          <li>Преподаватель: teacher@example.test</li>
          <li>Ученик: student@example.test</li>
        </ul>
      </section>
    </>
  );
}

