# Development Workflow

This project is developed with Codex assistance.

Codex must use the project specifications as the source of truth before making code changes.

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
4. Verify
5. Commit

## Development Rules

- Keep changes small and tied to one verifiable stage.
- Do not mix unrelated MVP stages in one commit.
- Prefer existing project patterns once the application code exists.
- Run available checks after changes.
- Do not revert user changes unless explicitly requested.

## Branch Workflow For MVP Stages

- Новый MVP stage нельзя реализовывать напрямую в `master`.
- Когда пользователь явно говорит начать код для stage, нужно создать отдельную ветку от актуального `master`.
- В ветку stage коммитится только завершенная и проверенная работа этого stage.
- После проверки ветка stage пушится в GitHub и готовится к pull request.
- Следующий stage нельзя начинать, пока предыдущий stage не смержен.
- Перед началом следующего stage нужно вернуться в `master` и обновить его из GitHub, чтобы новая ветка начиналась от последнего смерженного состояния.
- Цикл для каждого stage: обновить `master`, создать ветку stage, реализовать, проверить, закоммитить, запушить, открыть pull request, смержить, снова обновить `master`.

## Current MVP Direction

The next implementation step is Stage 0 from:

`docs/specs/06-work-plans/active/01-mvp-implementation-plan.md`

Stage 0 creates the technical foundation: Next.js, TypeScript, App Router, Prisma, development database, base layout, minimal role pages, and seed data.
