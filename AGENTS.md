# Development Workflow

This project is developed with Codex assistance.

Codex must use the project specifications as the source of truth before making code changes.

## Project Language

- The project language is Russian.
- Write project documentation and specification updates in Russian by default.
- Use Russian for user-facing interface copy unless a spec explicitly requires another language.
- Keep technical identifiers, file names, routes, commands, code, and third-party API names in their conventional language.

## Source of Truth

- Read `docs/roadmap/README.md` before implementation.
- Read relevant files in `docs/specs/` before implementation.
- Read the active work plan in `docs/work-plans/active/`.
- If a feature is not described in the specs, do not implement it.
- If a spec is unclear, clarify or update the spec before coding.
- Follow the active work plan named by `docs/roadmap/README.md` and
  `docs/work-plans/active/README.md`.

## Working Order

1. Spec
2. Plan
3. Code
4. Automated verify
5. Codex smoke verify
6. Optional user review gate
7. Commit

## Development Rules

- Keep changes small and tied to one verifiable stage.
- Do not mix unrelated MVP stages in one commit.
- Prefer existing project patterns once the application code exists.
- Run available checks after changes.
- After automated checks, Codex should run a basic smoke-check itself whenever the project can be checked locally.
- Before committing and pushing an MVP stage, summarize in Russian what Codex already checked and provide a short optional manual smoke-check checklist for the user.
- The user may skip manual review and explicitly tell Codex to continue. If the user asks to review manually, do not commit, push, or move to the next MVP stage until the user explicitly confirms to continue.
- When the user gives permission to finish the stage after checks, Codex should commit and push the stage branch. Codex does not open the pull request unless the user explicitly asks.
- Do not revert user changes unless explicitly requested.

## Branch Workflow For MVP Stages

- Новый MVP stage нельзя реализовывать напрямую в `main`.
- Когда пользователь явно говорит начать код для stage, нужно создать отдельную ветку от актуального `main`.
- В ветку stage коммитится только завершенная и проверенная работа этого stage.
- После автоматической проверки Codex сам выполняет базовую smoke-проверку stage, если это возможно локально.
- После своей smoke-проверки Codex кратко пишет пользователю, что уже проверено, и дает ручной smoke-чеклист только как необязательную финальную проверку.
- Ветка stage коммитится и пушится после явной команды пользователя продолжать; ручная проверка пользователя не обязательна, если пользователь ее пропускает.
- Pull request открывает пользователь. После merge пользователь сообщает Codex, Codex возвращается на `main`, обновляет его из GitHub и только потом начинает следующую stage-ветку.
- После подтверждения пользователя ветка stage пушится в GitHub и готовится к pull request.
- Следующий stage нельзя начинать, пока предыдущий stage не смержен.
- Перед началом следующего stage нужно вернуться в `main` и обновить его из GitHub, чтобы новая ветка начиналась от последнего смерженного состояния.
- Цикл для каждого stage: обновить `main`, создать ветку stage, реализовать, проверить, закоммитить, запушить, открыть pull request, смержить, снова обновить `main`.
- Если пользователь сообщает, что PR/stage смержен, Codex должен сам выполнить переход на `main` и обновление из GitHub перед обсуждением или началом следующего этапа. Пользователь не обязан отдельно писать команду "перейди на main".

## Current MVP Direction

The current roadmap is:

`docs/roadmap/README.md`

The current active implementation source of truth is named in:

`docs/work-plans/active/README.md`

Current active technical plan:

`docs/work-plans/active/04-supabase-foundation-plan.md`

Use the roadmap and the current status section in the active work plan to determine the next stage.
