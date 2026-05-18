import Link from "next/link";
import { getDevSession, workspaceConfig } from "@/app/lib/dev-auth";
import { loginAsAdmin, loginAsPrivateTeacher, loginAsStudent, loginAsTeacher } from "@/app/login/actions";

type EntryPageProps = {
  error?: string;
};

const roles = [
  {
    action: loginAsAdmin,
    audience: "Для учреждения",
    description: "Курсы, группы, ученики, преподаватели, расписание и оплата в едином учебном журнале.",
    email: "admin@example.test",
    label: "Войти как админ",
    title: "Администратор",
  },
  {
    action: loginAsTeacher,
    audience: "Для преподавателя",
    description: "Уроки, группы, посещаемость, оценки, комментарии, домашние задания и материалы.",
    email: "teacher@example.test",
    label: "Войти как преподаватель",
    title: "Преподаватель",
  },
  {
    action: loginAsStudent,
    audience: "Для ученика",
    description: "Расписание занятий, домашние задания, материалы, прогресс, посещаемость и платежи.",
    email: "student@example.test",
    label: "Войти как ученик",
    title: "Ученик",
  },
  {
    action: loginAsPrivateTeacher,
    audience: "Для частного преподавателя",
    description: "Тот же журнал без отдельной школы: ученики, уроки, материалы и базовый учет.",
    email: "solo-teacher@example.test",
    label: "Войти как преподаватель-одиночка",
    title: "Преподаватель-одиночка",
  },
];

export async function EntryPage({ error }: EntryPageProps) {
  const session = await getDevSession();
  const currentHomePath = session ? workspaceConfig[session.activeWorkspace].homePath : null;

  return (
    <div className="entry-shell">
      <header className="entry-topbar">
        <Link className="entry-brand" href="/">
          <span className="brand-mark">D</span>
          <span>Deshar</span>
        </Link>
        {session && currentHomePath ? (
          <Link className="secondary-button compact-button" href={currentHomePath}>
            Продолжить работу
          </Link>
        ) : (
          <a className="secondary-button compact-button" href="#entry-login">
            Войти
          </a>
        )}
      </header>

      <main className="entry-content">
        <section className="entry-hero">
          <div className="entry-hero-copy">
            <span className="status">Электронный журнал</span>
            <h1>Deshar</h1>
            <p>
              Продукт для образовательных учреждений, преподавателей и учеников: расписание, уроки, журнал
              посещаемости, оценки, домашние задания, материалы, прогресс и оплата в одном месте.
            </p>
            <div className="button-row">
              <a className="button" href="#entry-login">
                Выбрать вход
              </a>
              {session && currentHomePath ? (
                <Link className="secondary-button" href={currentHomePath}>
                  Продолжить как {session.name}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="entry-journal-preview" aria-label="Пример учебного журнала">
            <div className="entry-preview-header">
              <div>
                <span>Сегодня</span>
                <strong>Журнал группы</strong>
              </div>
              <span className="entry-preview-badge">Таджвид</span>
            </div>
            <div className="entry-preview-table">
              <div className="entry-preview-row entry-preview-head">
                <span>Ученик</span>
                <span>Посещ.</span>
                <span>Оценка</span>
                <span>ДЗ</span>
              </div>
              <div className="entry-preview-row">
                <strong>Амина Исмаилова</strong>
                <span className="entry-mark entry-mark-ok">П</span>
                <span>5</span>
                <span>есть</span>
              </div>
              <div className="entry-preview-row">
                <strong>Ученик</strong>
                <span className="entry-mark entry-mark-warning">У</span>
                <span>-</span>
                <span>ссылка</span>
              </div>
              <div className="entry-preview-row">
                <strong>Amruddy</strong>
                <span className="entry-mark entry-mark-danger">Н</span>
                <span>-</span>
                <span>-</span>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="error-message entry-error" role="alert">
            Тестовый вход работает без базы данных. Вернитесь на главную и выберите роль заново.
          </div>
        ) : null}

        <section className="entry-role-grid section" id="entry-login" aria-label="Вход по ролям">
          {roles.map((role) => (
            <form action={role.action} className="panel entry-role-card" key={role.email}>
              <span>{role.audience}</span>
              <h2>{role.title}</h2>
              <p>{role.description}</p>
              <strong>{role.email}</strong>
              <button className="button" type="submit">
                {role.label}
              </button>
            </form>
          ))}
        </section>

        <section className="entry-info-grid section">
          <div className="panel">
            <h2>Что закрывает журнал</h2>
            <ul className="muted-list">
              <li>Администратор видит группы, учеников, расписание, уроки и оплату.</li>
              <li>Преподаватель ведет урок, посещаемость, оценки, комментарии и материалы.</li>
              <li>Ученик открывает свое расписание, домашние задания, материалы и прогресс.</li>
            </ul>
          </div>

          <div className="panel">
            <h2>Вход сейчас</h2>
            <p>
              Это рабочая версия MPMF 1.0: пока используется dev-вход по ролям. Регистрация, восстановление
              пароля, публичный каталог и онлайн-оплата не включены в этот этап.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
