# Development Workflow

This project is developed with Codex assistance.

Codex must use the project specifications as the source of truth before making code changes.

## Local Codex Notifications

- VS Code starts the watcher through `.vscode\tasks.json` when the project folder is opened; watcher startup must be silent.
- Do not trigger a local Codex notification at the start of a session or before substantial work.
- Local Codex notifications are only for approval requests and task completion.
- If notification tooling is used, it must not play a sound for session start events.
- The watcher must ignore historical session log content and must only react to Codex sessions whose `cwd` is this project.
- The watcher is local runtime tooling only; do not commit `.codex-completion-sound.pid`.
- To start it manually outside Codex, run `scripts\start-codex-completion-sound.cmd`.
- To stop it manually, run `scripts\stop-codex-completion-sound.cmd`.

## Project Language

- The project language is Russian.
- Write project documentation and specification updates in Russian by default.
- Use Russian for user-facing interface copy unless a spec explicitly requires another language.
- Keep technical identifiers, file names, routes, commands, code, and third-party API names in their conventional language.

## Source of Truth

- Read relevant files in `docs/specs/` before implementation.
- If a feature is not described in the specs, do not implement it.
- If a spec is unclear, clarify or update the spec before coding.
- Follow the active MVP work plan in `docs/specs/06-work-plans/active/`.

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

- Новый MVP stage нельзя реализовывать напрямую в `master`.
- Когда пользователь явно говорит начать код для stage, нужно создать отдельную ветку от актуального `master`.
- В ветку stage коммитится только завершенная и проверенная работа этого stage.
- После автоматической проверки Codex сам выполняет базовую smoke-проверку stage, если это возможно локально.
- После своей smoke-проверки Codex кратко пишет пользователю, что уже проверено, и дает ручной smoke-чеклист только как необязательную финальную проверку.
- Ветка stage коммитится и пушится после явной команды пользователя продолжать; ручная проверка пользователя не обязательна, если пользователь ее пропускает.
- Pull request открывает пользователь. После merge пользователь сообщает Codex, Codex возвращается на `master`, обновляет его из GitHub и только потом начинает следующую stage-ветку.
- После подтверждения пользователя ветка stage пушится в GitHub и готовится к pull request.
- Следующий stage нельзя начинать, пока предыдущий stage не смержен.
- Перед началом следующего stage нужно вернуться в `master` и обновить его из GitHub, чтобы новая ветка начиналась от последнего смерженного состояния.
- Цикл для каждого stage: обновить `master`, создать ветку stage, реализовать, проверить, закоммитить, запушить, открыть pull request, смержить, снова обновить `master`.

## Current MVP Direction

The current implementation source of truth is:

`docs/specs/06-work-plans/active/01-mvp-implementation-plan.md`

Use the current status section in that active work plan to determine the next MVP stage.
