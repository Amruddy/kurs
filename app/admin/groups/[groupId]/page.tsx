import Link from "next/link";
import { DataTable, InfoList, SupabaseDataPage } from "@/app/components/supabase-data-page";
import { ConfirmSubmitButton } from "@/app/components/confirm-submit-button";
import { PageCreateAction } from "@/app/components/page-create-action";
import {
  addStudentToGroup,
  createGroupScheduleRule,
  deleteScheduleRule,
  generateLessonsForGroup,
  updateGroup,
} from "@/app/admin/actions";
import { getAdminGroupDetail } from "@/app/lib/data/supabase-read";
import { requireWorkspace } from "@/app/lib/dev-auth";

type AdminGroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

const groupStatuses = [
  { label: "Набор", value: "recruiting" },
  { label: "Активна", value: "active" },
  { label: "Пауза", value: "paused" },
  { label: "Завершена", value: "completed" },
  { label: "Архив", value: "archived" },
];

const weekdays = [
  { label: "Понедельник", value: "1" },
  { label: "Вторник", value: "2" },
  { label: "Среда", value: "3" },
  { label: "Четверг", value: "4" },
  { label: "Пятница", value: "5" },
  { label: "Суббота", value: "6" },
  { label: "Воскресенье", value: "0" },
];

function TrashIcon() {
  return (
    <svg className="trash-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 4h6m-8 4h10m-9 0 .7 12h6.6L16 8M10 11v6m4-6v6" />
    </svg>
  );
}

export default async function AdminGroupPage({ params }: AdminGroupPageProps) {
  const session = await requireWorkspace("admin");
  const { groupId } = await params;
  const result = await getAdminGroupDetail(session.organizationId, groupId);

  return (
    <SupabaseDataPage
      title="Карточка группы"
      description="Рабочая карточка группы, состава и ближайших занятий из Supabase."
      result={result}
    >
      {(data) => {
        const updateGroupAction = updateGroup.bind(null, data.id);
        const addStudentAction = addStudentToGroup.bind(null, data.id);
        const createScheduleRuleAction = createGroupScheduleRule.bind(null, data.id);
        const generateLessonsAction = generateLessonsForGroup.bind(null, data.id);

        return (
          <>
            <section className="admin-detail-grid">
              <div className="panel admin-main-panel">
                <div className="section-heading">
                  <div>
                    <h2>{data.name}</h2>
                    <p>
                      {data.course}; {data.teacher}; {data.status}
                    </p>
                  </div>
                  <details className="group-settings">
                    <summary className="button">Настройки</summary>
                    <div className="group-settings-actions">
                      <PageCreateAction buttonLabel="Изменить группу" title="Изменить группу">
                        <form action={updateGroupAction} className="form-grid">
                          <label>
                            Название
                            <input name="name" required defaultValue={data.name} />
                          </label>
                          <label>
                            Преподаватель
                            <select name="teacherId" defaultValue={data.teacherId ?? ""}>
                              <option value="">Без преподавателя</option>
                              {data.teacherOptions.map((teacher) => (
                                <option key={teacher.value} value={teacher.value}>
                                  {teacher.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Статус
                            <select name="status" required defaultValue={data.statusValue}>
                              {groupStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button className="button" type="submit">
                            Сохранить
                          </button>
                        </form>
                      </PageCreateAction>

                      <PageCreateAction buttonLabel="Добавить ученика" title="Добавить ученика">
                        {data.studentOptions.length > 0 ? (
                          <form action={addStudentAction} className="form-grid">
                            <label>
                              Ученик
                              <select name="studentId" required defaultValue="">
                                <option value="" disabled>
                                  Выберите ученика
                                </option>
                                {data.studentOptions.map((student) => (
                                  <option key={student.value} value={student.value}>
                                    {student.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button className="button" type="submit">
                              Добавить в группу
                            </button>
                          </form>
                        ) : (
                          <p className="empty-state">Все активные ученики уже добавлены в группу.</p>
                        )}
                      </PageCreateAction>

                      <PageCreateAction buttonLabel="Настроить расписание" title="Новое правило расписания">
                        <form action={createScheduleRuleAction} className="form-grid">
                          <fieldset className="weekday-picker">
                            <legend>Дни недели</legend>
                            <div className="weekday-options">
                              {weekdays.map((weekday) => (
                                <label className="checkbox-label" key={weekday.value}>
                                  <input
                                    name="weekdays"
                                    type="checkbox"
                                    value={weekday.value}
                                    defaultChecked={weekday.value === "1"}
                                  />
                                  {weekday.label}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                          <label>
                            Время начала
                            <input name="startTime" type="time" required defaultValue="10:00" />
                          </label>
                          <label>
                            Время окончания
                            <input name="endTime" type="time" required defaultValue="11:00" />
                          </label>
                          <label>
                            Действует с
                            <input name="startsOn" type="date" required />
                          </label>
                          <label>
                            Действует до
                            <input name="endsOn" type="date" />
                          </label>
                          <button className="button" type="submit">
                            Сохранить правило
                          </button>
                        </form>
                        <p className="form-note">
                          Выберите один или несколько дней. Правило может действовать весь учебный срок.
                        </p>
                      </PageCreateAction>

                      <PageCreateAction buttonLabel="Создать уроки" title="Создать уроки по расписанию">
                        {data.scheduleRules.length > 0 ? (
                          <form action={generateLessonsAction} className="form-grid">
                            <label>
                              Срок создания
                              <select name="horizon" required defaultValue="one_month">
                                <option value="one_month">На 1 месяц</option>
                                <option value="three_months">На 3 месяца</option>
                                <option value="schedule_end">До окончания расписания</option>
                              </select>
                            </label>
                            <button className="button" type="submit">
                              Создать уроки
                            </button>
                          </form>
                        ) : (
                          <p className="empty-state">Сначала добавьте хотя бы одно правило расписания.</p>
                        )}
                        <p className="form-note">
                          Это создает конкретные уроки в выбранном периоде. Само расписание хранится отдельно как правило.
                        </p>
                      </PageCreateAction>
                    </div>
                  </details>
                </div>

                <DataTable
                  rows={data.students}
                  keyForRow={(student) => student.groupStudentId}
                  emptyText="В группе пока нет активных учеников."
                  columns={[
                    { header: "Ученик", render: (student) => <strong>{student.name}</strong> },
                    { header: "Контакты", render: (student) => student.contacts },
                    { header: "Добавлен", render: (student) => student.joinedAt },
                    { header: "Статус", render: (student) => student.status },
                  ]}
                />
              </div>

              <aside className="panel admin-side-panel">
                <h2>Состояние</h2>
                <div className="info-list">
                  <div className="info-row">
                    <span>Курс</span>
                    <strong>{data.course}</strong>
                  </div>
                  <div className="info-row">
                    <span>Преподаватель</span>
                    <strong>{data.teacher}</strong>
                  </div>
                  <div className="info-row">
                    <span>Статус</span>
                    <strong>{data.status}</strong>
                  </div>
                </div>

                <div className="button-row">
                  <Link className="secondary-button compact-button" href="/admin/groups">
                    К списку групп
                  </Link>
                </div>
              </aside>
            </section>

            <section className="grid section">
              <div className="panel">
                <h2>Проблемы</h2>
                {data.problemSignals.length > 0 ? (
                  <div className="signal-list">
                    {data.problemSignals.map((signal) => (
                      <div className="signal-item" data-tone={signal.tone} key={signal.label}>
                        <strong>!</strong>
                        <div>
                          <span>{signal.label}</span>
                          <p>{signal.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="signal-item" data-tone="ok">
                    <strong>OK</strong>
                    <div>
                      <span>Ключевые шаги заполнены</span>
                      <p>У группы есть преподаватель, ученики, расписание и ближайшие занятия.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="panel">
                <h2>Расписание</h2>
                {data.scheduleRules.length > 0 ? (
                  <div className="schedule-card-list">
                    {data.scheduleRules.map((rule) => {
                      const deleteScheduleRuleAction = deleteScheduleRule.bind(null, rule.id, data.id);

                      return (
                        <div className="schedule-card" key={rule.id}>
                          <div>
                            <span>{rule.weekday}</span>
                            <strong>{rule.timeRange}</strong>
                            <p>{rule.period}</p>
                          </div>
                          <form action={deleteScheduleRuleAction} className="inline-form">
                            <ConfirmSubmitButton
                              className="secondary-button compact-button icon-button"
                              message={`Точно удалить расписание: ${rule.weekday}, ${rule.timeRange}?`}
                            >
                              <TrashIcon />
                              <span className="visually-hidden">Удалить</span>
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state">Активное расписание пока не настроено.</p>
                )}
              </div>

              <div className="panel">
                <h2>Ближайшие занятия</h2>
                <InfoList
                  emptyText="Ближайшие занятия пока не созданы."
                  items={data.upcomingLessons.map((lesson) => (
                    <div className="info-row" key={lesson.id}>
                      <span>{lesson.when}</span>
                      <strong>{lesson.title}</strong>
                      <p>{lesson.subtitle}</p>
                    </div>
                  ))}
                />
              </div>
            </section>
          </>
        );
      }}
    </SupabaseDataPage>
  );
}
