import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  LogOut,
  MessageSquareText,
  Plus,
  Search,
  Send,
  UserRound,
} from 'lucide-react'

import Login from './pages/Login'
import './App.css'

type Actor = 'Randy' | 'Ed'

type Status =
  | 'Open'
  | 'Bezig'
  | 'Wacht op'
  | 'Afgerond'

type Priority =
  | 'Laag'
  | 'Normaal'
  | 'Hoog'
  | 'Kritiek'

interface Task {
  id: string
  category: string
  title: string
  description: string | null
  status: Status
  assigned_to: 'Randy' | 'Ed' | 'Samen'
  priority: Priority
  deadline: string | null
  created_by: Actor | null
  updated_by: Actor | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

interface Comment {
  id: string
  task_id: string
  author: Actor
  comment: string
  created_at: string
}

interface NewTask {
  title: string
  category: string
  description: string
  assigned_to: 'Randy' | 'Ed' | 'Samen'
  priority: Priority
  deadline: string
}

const emptyNewTask: NewTask = {
  title: '',
  category: 'Platform',
  description: '',
  assigned_to: 'Samen',
  priority: 'Normaal',
  deadline: '',
}

function App() {
  const [actor, setActor] =
    useState<Actor | null>(null)

  const [checking, setChecking] =
    useState(true)

  const [tasks, setTasks] =
    useState<Task[]>([])

  const [loadingTasks, setLoadingTasks] =
    useState(false)

  const [error, setError] =
    useState('')

  const [filter, setFilter] =
    useState('Alles')

  const [search, setSearch] =
    useState('')

  const [showNewTask, setShowNewTask] =
    useState(false)

  const [newTask, setNewTask] =
    useState<NewTask>(emptyNewTask)

  const [saving, setSaving] =
    useState(false)

  const [expandedTask, setExpandedTask] =
    useState<string | null>(null)

  const [comments, setComments] =
    useState<Record<string, Comment[]>>({})

  const [loadingComments, setLoadingComments] =
    useState<Record<string, boolean>>({})

  const [noteDrafts, setNoteDrafts] =
    useState<Record<string, string>>({})

  const [savingNote, setSavingNote] =
    useState<Record<string, boolean>>({})

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(
          '/api/me',
          {
            credentials: 'include',
          }
        )

        if (!response.ok) {
          return
        }

        const data =
          await response.json()

        if (
          data.authenticated &&
          (
            data.actor === 'Randy' ||
            data.actor === 'Ed'
          )
        ) {
          setActor(data.actor)
        }
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (!actor) {
      return
    }

    loadTasks()

    const refresh = async () => {
      try {
        const response = await fetch(
          '/api/tasks',
          {
            credentials: 'include',
            cache: 'no-store',
          }
        )

        if (response.status === 401) {
          setActor(null)
          return
        }

        if (response.ok) {
          const data =
            await response.json()

          setTasks(
            data.tasks ?? []
          )
        }

        if (expandedTask) {
          const commentsResponse =
            await fetch(
              `/api/tasks/${expandedTask}/comments`,
              {
                credentials: 'include',
                cache: 'no-store',
              }
            )

          if (
            commentsResponse.ok
          ) {
            const commentsData =
              await commentsResponse.json()

            setComments(
              current => ({
                ...current,
                [expandedTask]:
                  commentsData.comments ??
                  [],
              })
            )
          }
        }
      } catch {
        // Een tijdelijke netwerkfout
        // mag de huidige checklist
        // niet onderbreken.
      }
    }

    const interval =
      window.setInterval(
        refresh,
        10000
      )

    return () => {
      window.clearInterval(
        interval
      )
    }
  }, [actor, expandedTask])

  async function loadTasks() {
    setLoadingTasks(true)
    setError('')

    try {
      const response = await fetch(
        '/api/tasks',
        {
          credentials: 'include',
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ??
          'Taken konden niet worden geladen.'
        )
      }

      setTasks(data.tasks ?? [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Taken konden niet worden geladen.'
      )
    } finally {
      setLoadingTasks(false)
    }
  }

  async function logout() {
    await fetch(
      '/api/logout',
      {
        method: 'POST',
        credentials: 'include',
      }
    )

    setActor(null)
    setTasks([])
    setExpandedTask(null)
  }

  async function updateTask(
    id: string,
    patch: Partial<Task>
  ) {
    const previous = tasks

    setTasks(current =>
      current.map(task =>
        task.id === id
          ? {
              ...task,
              ...patch,
            }
          : task
      )
    )

    try {
      const response = await fetch(
        `/api/tasks/${id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body:
            JSON.stringify(patch),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ??
          'Wijziging kon niet worden opgeslagen.'
        )
      }

      if (data.task) {
        setTasks(current =>
          current.map(task =>
            task.id === id
              ? data.task
              : task
          )
        )
      }
    } catch (err) {
      setTasks(previous)

      alert(
        err instanceof Error
          ? err.message
          : 'Wijziging kon niet worden opgeslagen.'
      )
    }
  }

  async function addTask(
    event: React.FormEvent
  ) {
    event.preventDefault()

    if (!newTask.title.trim()) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        '/api/tasks',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            ...newTask,
            deadline:
              newTask.deadline || null,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ??
          'Taak kon niet worden toegevoegd.'
        )
      }

      setTasks(current => [
        ...current,
        data.task,
      ])

      setNewTask(emptyNewTask)
      setShowNewTask(false)
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Taak kon niet worden toegevoegd.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function loadComments(
    taskId: string
  ) {
    if (comments[taskId]) {
      return
    }

    setLoadingComments(current => ({
      ...current,
      [taskId]: true,
    }))

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/comments`,
        {
          credentials: 'include',
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ??
          'Notities konden niet worden geladen.'
        )
      }

      setComments(current => ({
        ...current,
        [taskId]:
          data.comments ?? [],
      }))
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Notities konden niet worden geladen.'
      )
    } finally {
      setLoadingComments(current => ({
        ...current,
        [taskId]: false,
      }))
    }
  }

  async function toggleTask(
    taskId: string
  ) {
    if (expandedTask === taskId) {
      setExpandedTask(null)
      return
    }

    setExpandedTask(taskId)
    await loadComments(taskId)
  }

  async function addNote(
    taskId: string
  ) {
    const note =
      noteDrafts[taskId]?.trim()

    if (!note) {
      return
    }

    setSavingNote(current => ({
      ...current,
      [taskId]: true,
    }))

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/comments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            comment: note,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ??
          'Notitie kon niet worden opgeslagen.'
        )
      }

      setComments(current => ({
        ...current,
        [taskId]: [
          ...(current[taskId] ?? []),
          data.comment,
        ],
      }))

      setNoteDrafts(current => ({
        ...current,
        [taskId]: '',
      }))
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Notitie kon niet worden opgeslagen.'
      )
    } finally {
      setSavingNote(current => ({
        ...current,
        [taskId]: false,
      }))
    }
  }

  const totals = useMemo(() => {
    const total =
      tasks.length

    const completed =
      tasks.filter(
        task =>
          task.status === 'Afgerond'
      ).length

    const bezig =
      tasks.filter(
        task =>
          task.status === 'Bezig'
      ).length

    const open =
      tasks.filter(
        task =>
          task.status === 'Open'
      ).length

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdue =
      tasks.filter(task => {
        if (
          !task.deadline ||
          task.status === 'Afgerond'
        ) {
          return false
        }

        return (
          new Date(
            `${task.deadline}T00:00:00`
          ) < today
        )
      }).length

    const progress =
      total === 0
        ? 0
        : Math.round(
            (completed / total) *
              100
          )

    return {
      total,
      completed,
      bezig,
      open,
      overdue,
      progress,
    }
  }, [tasks])

  const filteredTasks =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase()

      return tasks.filter(task => {
        let matchesFilter = true

        if (filter === 'Mijn taken') {
          matchesFilter =
            task.assigned_to === actor ||
            task.assigned_to === 'Samen'
        } else if (
          [
            'Randy',
            'Ed',
            'Samen',
          ].includes(filter)
        ) {
          matchesFilter =
            task.assigned_to === filter
        } else if (
          [
            'Open',
            'Bezig',
            'Wacht op',
            'Afgerond',
          ].includes(filter)
        ) {
          matchesFilter =
            task.status === filter
        }

        const matchesSearch =
          !q ||
          task.title
            .toLowerCase()
            .includes(q) ||
          task.category
            .toLowerCase()
            .includes(q) ||
          (
            task.description ?? ''
          )
            .toLowerCase()
            .includes(q)

        return (
          matchesFilter &&
          matchesSearch
        )
      })
    }, [
      tasks,
      filter,
      search,
      actor,
    ])

  const groupedTasks =
    useMemo(() => {
      const result:
        Record<string, Task[]> = {}

      for (
        const task of
        filteredTasks
      ) {
        if (
          !result[task.category]
        ) {
          result[task.category] = []
        }

        result[task.category].push(
          task
        )
      }

      return result
    }, [filteredTasks])

  if (checking) {
    return (
      <div className="loading-screen">
        Bestemd wordt geladen...
      </div>
    )
  }

  if (!actor) {
    return (
      <Login
        onLogin={setActor}
      />
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img
            src="/bestemd-icon.png"
            alt=""
          />

          <div>
            <span>BESTEMD</span>

            <h1>
              Project Checklist
            </h1>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="account-pill">
            <UserRound size={17} />
            {actor}
          </div>

          <button
            className="secondary-button"
            onClick={logout}
          >
            <LogOut size={17} />
            Uitloggen
          </button>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">
            Gezamenlijke werkvoorraad
          </p>

          <h2>
            Goedemorgen, {actor}
          </h2>

          <p>
            Alles wat Randy en Ed nog
            moeten regelen voor Bestemd,
            op één plek.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowNewTask(true)
          }
        >
          <Plus size={18} />
          Nieuwe taak
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Totaal</span>
          <strong>
            {totals.total}
          </strong>
          <small>taken</small>
        </article>

        <article className="stat-card">
          <span>Afgerond</span>
          <strong>
            {totals.completed}
          </strong>
          <small>
            {totals.progress}% gereed
          </small>
        </article>

        <article className="stat-card">
          <span>Bezig</span>
          <strong>
            {totals.bezig}
          </strong>
          <small>actief</small>
        </article>

        <article className="stat-card">
          <span>Open</span>
          <strong>
            {totals.open}
          </strong>
          <small>te doen</small>
        </article>

        <article
          className={
            totals.overdue > 0
              ? 'stat-card warning'
              : 'stat-card'
          }
        >
          <span>Te laat</span>
          <strong>
            {totals.overdue}
          </strong>
          <small>
            deadline verlopen
          </small>
        </article>
      </section>

      <section className="progress-card">
        <div className="progress-header">
          <strong>
            Totale voortgang
          </strong>

          <span>
            {totals.progress}%
          </span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width:
                `${totals.progress}%`,
            }}
          />
        </div>
      </section>

      <section className="toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Zoek een taak..."
          />
        </div>

        <div className="filter-row">
          {[
            'Alles',
            'Mijn taken',
            'Randy',
            'Ed',
            'Samen',
            'Open',
            'Bezig',
            'Wacht op',
            'Afgerond',
          ].map(item => (
            <button
              key={item}
              className={
                filter === item
                  ? 'filter active'
                  : 'filter'
              }
              onClick={() =>
                setFilter(item)
              }
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loadingTasks ? (
        <div className="empty-state">
          Checklist wordt geladen...
        </div>
      ) : (
        <section className="task-sections">
          {Object.entries(
            groupedTasks
          ).map(
            ([category, items]) => (
              <section
                className="task-section"
                key={category}
              >
                <div className="section-title">
                  <div>
                    <span>
                      Categorie
                    </span>

                    <h3>
                      {category}
                    </h3>
                  </div>

                  <strong>
                    {items.length}
                  </strong>
                </div>

                <div className="task-table-head">
                  <div />
                  <div>Taak</div>
                  <div>Status</div>
                  <div>Voor</div>
                  <div>Prioriteit</div>
                  <div>Deadline</div>
                  <div />
                </div>

                <div className="task-list">
                  {items.map(task => {
                    const isOpen =
                      expandedTask ===
                      task.id

                    const overdue =
                      !!task.deadline &&
                      task.status !==
                        'Afgerond' &&
                      new Date(
                        `${task.deadline}T00:00:00`
                      ) <
                        new Date(
                          new Date()
                            .setHours(
                              0,
                              0,
                              0,
                              0
                            )
                        )

                    const taskComments =
                      comments[
                        task.id
                      ] ?? []

                    return (
                      <article
                        className={
                          isOpen
                            ? 'compact-task expanded'
                            : 'compact-task'
                        }
                        key={task.id}
                      >
                        <div className="task-row">
                          <button
                            className="complete-button"
                            onClick={() =>
                              updateTask(
                                task.id,
                                {
                                  status:
                                    task.status ===
                                    'Afgerond'
                                      ? 'Open'
                                      : 'Afgerond',
                                }
                              )
                            }
                            title={
                              task.status ===
                              'Afgerond'
                                ? 'Heropen taak'
                                : 'Afronden'
                            }
                          >
                            {task.status ===
                            'Afgerond' ? (
                              <CheckCircle2
                                size={22}
                              />
                            ) : (
                              <Circle
                                size={22}
                              />
                            )}
                          </button>

                          <button
                            className="task-name"
                            onClick={() =>
                              toggleTask(
                                task.id
                              )
                            }
                          >
                            <span
                              className={
                                task.status ===
                                'Afgerond'
                                  ? 'done'
                                  : ''
                              }
                            >
                              {task.title}
                            </span>

                            {taskComments.length >
                              0 && (
                              <small>
                                <MessageSquareText
                                  size={13}
                                />
                                {
                                  taskComments.length
                                }
                              </small>
                            )}
                          </button>

                          <select
                            className="compact-select"
                            value={task.status}
                            onChange={event =>
                              updateTask(
                                task.id,
                                {
                                  status:
                                    event
                                      .target
                                      .value as Status,
                                }
                              )
                            }
                          >
                            <option>
                              Open
                            </option>
                            <option>
                              Bezig
                            </option>
                            <option>
                              Wacht op
                            </option>
                            <option>
                              Afgerond
                            </option>
                          </select>

                          <select
                            className="compact-select"
                            value={
                              task.assigned_to
                            }
                            onChange={event =>
                              updateTask(
                                task.id,
                                {
                                  assigned_to:
                                    event
                                      .target
                                      .value as Task['assigned_to'],
                                }
                              )
                            }
                          >
                            <option>
                              Randy
                            </option>
                            <option>
                              Ed
                            </option>
                            <option>
                              Samen
                            </option>
                          </select>

                          <span
                            className={
                              `priority ${
                                task.priority
                              }`
                            }
                          >
                            {task.priority}
                          </span>

                          <span
                            className={
                              overdue
                                ? 'compact-deadline overdue'
                                : 'compact-deadline'
                            }
                          >
                            {task.deadline ? (
                              <>
                                {overdue ? (
                                  <AlertTriangle
                                    size={14}
                                  />
                                ) : (
                                  <CalendarDays
                                    size={14}
                                  />
                                )}

                                {new Date(
                                  `${task.deadline}T00:00:00`
                                ).toLocaleDateString(
                                  'nl-NL'
                                )}
                              </>
                            ) : (
                              '—'
                            )}
                          </span>

                          <button
                            className="expand-button"
                            onClick={() =>
                              toggleTask(
                                task.id
                              )
                            }
                            aria-label="Taak openen"
                          >
                            {isOpen ? (
                              <ChevronUp
                                size={19}
                              />
                            ) : (
                              <ChevronDown
                                size={19}
                              />
                            )}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="task-details">
                            <div className="detail-grid">
                              <div className="description-panel">
                                <span className="detail-label">
                                  Omschrijving
                                </span>

                                <p>
                                  {task.description ||
                                    'Voor deze taak is nog geen omschrijving toegevoegd.'}
                                </p>
                              </div>

                              <div className="notes-panel">
                                <div className="notes-title">
                                  <span className="detail-label">
                                    Notities
                                  </span>

                                  <span>
                                    {
                                      taskComments.length
                                    }{' '}
                                    {taskComments.length ===
                                    1
                                      ? 'notitie'
                                      : 'notities'}
                                  </span>
                                </div>

                                {loadingComments[
                                  task.id
                                ] ? (
                                  <div className="notes-empty">
                                    Notities worden geladen...
                                  </div>
                                ) : taskComments.length ===
                                  0 ? (
                                  <div className="notes-empty">
                                    Nog geen notities bij deze taak.
                                  </div>
                                ) : (
                                  <div className="notes-list">
                                    {taskComments.map(
                                      comment => (
                                        <div
                                          className="note-item"
                                          key={
                                            comment.id
                                          }
                                        >
                                          <div className="note-meta">
                                            <strong>
                                              {
                                                comment.author
                                              }
                                            </strong>

                                            <span>
                                              {new Date(
                                                comment.created_at
                                              ).toLocaleString(
                                                'nl-NL',
                                                {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                }
                                              )}
                                            </span>
                                          </div>

                                          <p>
                                            {
                                              comment.comment
                                            }
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                                <div className="note-input-row">
                                  <textarea
                                    rows={2}
                                    value={
                                      noteDrafts[
                                        task.id
                                      ] ?? ''
                                    }
                                    onChange={event =>
                                      setNoteDrafts(
                                        current => ({
                                          ...current,
                                          [task.id]:
                                            event
                                              .target
                                              .value,
                                        })
                                      )
                                    }
                                    placeholder="Typ een notitie voor deze taak..."
                                  />

                                  <button
                                    className="send-note-button"
                                    onClick={() =>
                                      addNote(
                                        task.id
                                      )
                                    }
                                    disabled={
                                      savingNote[
                                        task.id
                                      ] ||
                                      !(
                                        noteDrafts[
                                          task.id
                                        ] ?? ''
                                      ).trim()
                                    }
                                  >
                                    <Send
                                      size={16}
                                    />

                                    {savingNote[
                                      task.id
                                    ]
                                      ? 'Opslaan...'
                                      : 'Notitie toevoegen'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            )
          )}
        </section>
      )}

      {showNewTask && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setShowNewTask(false)
          }
        >
          <form
            className="task-modal"
            onSubmit={addTask}
            onMouseDown={event =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span>BESTEMD</span>
                <h3>
                  Nieuwe taak
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNewTask(false)
                }
              >
                ×
              </button>
            </div>

            <label>
              Titel

              <input
                value={
                  newTask.title
                }
                onChange={event =>
                  setNewTask({
                    ...newTask,
                    title:
                      event.target.value,
                  })
                }
                autoFocus
                required
              />
            </label>

            <div className="two-columns">
              <label>
                Categorie

                <select
                  value={
                    newTask.category
                  }
                  onChange={event =>
                    setNewTask({
                      ...newTask,
                      category:
                        event.target.value,
                    })
                  }
                >
                  <option>
                    Platform
                  </option>
                  <option>
                    Organisatie
                  </option>
                  <option>
                    Website
                  </option>
                  <option>
                    Marketing
                  </option>
                  <option>
                    Juridisch
                  </option>
                </select>
              </label>

              <label>
                Verantwoordelijke

                <select
                  value={
                    newTask.assigned_to
                  }
                  onChange={event =>
                    setNewTask({
                      ...newTask,
                      assigned_to:
                        event.target
                          .value as NewTask['assigned_to'],
                    })
                  }
                >
                  <option>
                    Randy
                  </option>
                  <option>
                    Ed
                  </option>
                  <option>
                    Samen
                  </option>
                </select>
              </label>
            </div>

            <div className="two-columns">
              <label>
                Prioriteit

                <select
                  value={
                    newTask.priority
                  }
                  onChange={event =>
                    setNewTask({
                      ...newTask,
                      priority:
                        event.target
                          .value as Priority,
                    })
                  }
                >
                  <option>
                    Laag
                  </option>
                  <option>
                    Normaal
                  </option>
                  <option>
                    Hoog
                  </option>
                  <option>
                    Kritiek
                  </option>
                </select>
              </label>

              <label>
                Deadline

                <input
                  type="date"
                  value={
                    newTask.deadline
                  }
                  onChange={event =>
                    setNewTask({
                      ...newTask,
                      deadline:
                        event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label>
              Omschrijving

              <textarea
                rows={4}
                value={
                  newTask.description
                }
                onChange={event =>
                  setNewTask({
                    ...newTask,
                    description:
                      event.target.value,
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setShowNewTask(false)
                }
              >
                Annuleren
              </button>

              <button
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? 'Opslaan...'
                  : 'Taak toevoegen'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

export default App