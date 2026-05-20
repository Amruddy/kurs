import Link from "next/link";
import { updatePassword } from "@/app/auth/reset-password/actions";

const errorMessages: Record<string, string> = {
  password_mismatch: "Пароли не совпадают.",
  password_too_short: "Пароль должен быть не короче 8 символов.",
  password_update_failed: "Не удалось обновить пароль. Проверьте ссылку из письма и попробуйте еще раз.",
  supabase_not_configured: "Supabase Auth еще не настроен для этого окружения.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? errorMessages[params.error] ?? "Не удалось обновить пароль." : null;

  return (
    <main className="public-shell auth-page-shell">
      <section className="panel auth-page-card">
        <Link className="entry-brand" href="/">
          <span className="brand-mark">D</span>
          <span>Deshar</span>
        </Link>

        <div>
          <span className="status">Новый пароль</span>
          <h1>Установите пароль</h1>
          <p>Введите новый пароль для аккаунта. После сохранения система откроет вашу рабочую область.</p>
        </div>

        {errorMessage ? (
          <div className="error-message" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <form action={updatePassword} className="form-grid auth-form">
          <label>
            Новый пароль
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <label>
            Повторите пароль
            <input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <button className="button" type="submit">
            Сохранить пароль
          </button>
          <Link className="secondary-button" href="/login">
            Вернуться ко входу
          </Link>
        </form>
      </section>
    </main>
  );
}
