
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import AuthPage from './pages/AuthPage'
import {
  createProject,
  getProjects,
  type Project,
} from './services/projects'
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from './services/tasks'

function App() {
  // const [token, setToken] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(
  () => localStorage.getItem('clientflow_token'),
)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  )

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [error, setError] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM')
  const [creatingTask, setCreatingTask] = useState(false)

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null

  const loadProjects = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await getProjects(token)
      setProjects(data)

      setSelectedProjectId((current) => {
        if (current && data.some((project) => project.id === current)) {
          return current
        }
        return data[0]?.id ?? null
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load projects.',
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  const loadTasks = useCallback(async () => {
    if (!token || !selectedProjectId) {
      setTasks([])
      return
    }

    setTasksLoading(true)
    setError('')

    try {
      const data = await getTasks(token, selectedProjectId)
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks.')
      setTasks([])
    } finally {
      setTasksLoading(false)
    }
  }, [token, selectedProjectId])

  useEffect(() => {
    if (token) void loadProjects()
  }, [token, loadProjects])

  useEffect(() => {
    if (token && selectedProjectId) {
      void loadTasks()
    } else {
      setTasks([])
    }
  }, [token, selectedProjectId, loadTasks])

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setCreating(true)
    setError('')

    try {
      const project = await createProject(token, {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      })

      setProjects((current) => [project, ...current])
      setSelectedProjectId(project.id)
      setProjectName('')
      setProjectDescription('')
      setShowCreateForm(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create project.',
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !selectedProjectId) return

    setCreatingTask(true)
    setError('')

    try {
      const task = await createTask(token, selectedProjectId, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
      })

      setTasks((current) => [task, ...current])
      setTaskTitle('')
      setTaskDescription('')
      setTaskPriority('MEDIUM')
      setShowTaskForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create task.')
    } finally {
      setCreatingTask(false)
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (!token || !selectedProjectId || task.status === status) return

    setError('')

    try {
      const updatedTask = await updateTask(
        token,
        selectedProjectId,
        task.id,
        { status },
      )

      setTasks((current) =>
        current.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update task.')
    }
  }
  async function handleDeleteTask(taskId: string) {
  if (!token || !selectedProjectId) return

  const confirmed = window.confirm(
    'Are you sure you want to delete this task?',
  )

  if (!confirmed) return

  try {
    await deleteTask(token, selectedProjectId, taskId)

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    )
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Failed to delete task',
    )
  }
}

function handleSignOut() {
  localStorage.removeItem('clientflow_token')
  setToken(null)
  setProjects([])
  setTasks([])
  setSelectedProjectId(null)
  setError('')
}

  if (!token) {
    return <AuthPage
  onLogin={(newToken) => {
    localStorage.setItem('clientflow_token', newToken)
    setToken(newToken)
  }}
/>
  }

  const activeProjects = projects.filter(
    (project) => project.status === 'ACTIVE',
  ).length

  const completedProjects = projects.filter(
    (project) => project.status === 'COMPLETED',
  ).length

  const completedTasks = tasks.filter((task) => task.status === 'DONE').length
  const inProgressTasks = tasks.filter(
    (task) => task.status === 'IN_PROGRESS',
  ).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-900/80 p-6 md:block">
        <h1 className="text-2xl font-bold tracking-tight">
          Client<span className="text-violet-400">Flow</span>
        </h1>

        <p className="mt-2 text-xs text-slate-500">PROJECT MANAGEMENT</p>

        <nav className="mt-10 space-y-2">
          <div className="rounded-xl bg-violet-500/15 px-4 py-3 font-medium text-violet-300">
            Dashboard
          </div>
          <a
            href="#projects"
            className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Projects
          </a>
          <a
            href="#tasks"
            className="block rounded-xl px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Tasks
          </a>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="md:ml-64">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-6 sm:px-10">
          <div>
            <p className="text-sm text-slate-400">Workspace</p>
            <h2 className="mt-1 text-2xl font-semibold">Dashboard</h2>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400"
          >
            + New project
          </button>
        </header>

        <div className="space-y-8 p-6 sm:p-10">
          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  if (selectedProjectId) {
                    void loadTasks()
                  } else {
                    void loadProjects()
                  }
                }}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {showCreateForm && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold">Create a project</h3>

              <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="projectName"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Project name
                  </label>
                  <input
                    id="projectName"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    minLength={2}
                    maxLength={150}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    placeholder="e.g. Website redesign"
                  />
                </div>

                <div>
                  <label
                    htmlFor="projectDescription"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(event) =>
                      setProjectDescription(event.target.value)
                    }
                    maxLength={5000}
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    placeholder="What is this project about?"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400 disabled:opacity-60"
                  >
                    {creating ? 'Creating...' : 'Create project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-xl border border-slate-700 px-5 py-3 text-sm hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total projects"
              value={projects.length}
              detail="Projects you own"
            />
            <StatCard
              label="Active projects"
              value={activeProjects}
              detail="Currently in progress"
            />
            <StatCard
              label="Completed projects"
              value={completedProjects}
              detail="Successfully finished"
            />
          </section>

          <section id="projects">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Your projects</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Select a project to manage its tasks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadProjects()}
                disabled={loading}
                className="text-sm text-violet-300 hover:text-violet-200 disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-800 p-10 text-center text-slate-400">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                <h4 className="text-lg font-semibold">No projects yet</h4>
                <p className="mt-2 text-sm text-slate-400">
                  Create your first project to get started.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="mt-5 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {projects.map((project) => (
                  <button
                    type="button"
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`rounded-2xl border bg-slate-900/70 p-6 text-left transition hover:border-violet-400 ${
                      selectedProjectId === project.id
                        ? 'border-violet-400 ring-1 ring-violet-400/30'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold">{project.name}</h4>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                          project.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : project.status === 'ON_HOLD'
                              ? 'bg-amber-500/10 text-amber-300'
                              : 'bg-violet-500/10 text-violet-300'
                        }`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="mt-3 min-h-10 text-sm leading-6 text-slate-400">
                      {project.description || 'No description provided.'}
                    </p>

                    <p className="mt-5 text-xs text-slate-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>

                    <p className="mt-3 text-xs font-medium text-violet-300">
                      {selectedProjectId === project.id
                        ? 'Currently selected'
                        : 'Select project →'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section id="tasks" className="scroll-mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedProject
                    ? `Tasks · ${selectedProject.name}`
                    : 'Project tasks'}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedProject
                    ? 'Create tasks and track their progress.'
                    : 'Create a project first to start managing tasks.'}
                </p>
              </div>

              <button
                type="button"
                disabled={!selectedProject}
                onClick={() => setShowTaskForm((current) => !current)}
                className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + New task
              </button>
            </div>

            {selectedProject && (
              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total tasks"
                  value={tasks.length}
                  detail="In this project"
                />
                <StatCard
                  label="In progress"
                  value={inProgressTasks}
                  detail="Currently underway"
                />
                <StatCard
                  label="Completed tasks"
                  value={completedTasks}
                  detail="Marked as done"
                />
              </div>
            )}

            {showTaskForm && selectedProject && (
              <form
                onSubmit={handleCreateTask}
                className="mb-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <h4 className="text-lg font-semibold">Create a task</h4>

                <div>
                  <label
                    htmlFor="taskTitle"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Task title
                  </label>
                  <input
                    id="taskTitle"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    minLength={2}
                    maxLength={200}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    placeholder="e.g. Build the login page"
                  />
                </div>

                <div>
                  <label
                    htmlFor="taskDescription"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="taskDescription"
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    maxLength={5000}
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    placeholder="Describe what needs to be done."
                  />
                </div>

                <div>
                  <label
                    htmlFor="taskPriority"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Priority
                  </label>
                  <select
                    id="taskPriority"
                    value={taskPriority}
                    onChange={(event) =>
                      setTaskPriority(event.target.value as TaskPriority)
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400 disabled:opacity-60"
                  >
                    {creatingTask ? 'Creating...' : 'Create task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="rounded-xl border border-slate-700 px-5 py-3 text-sm hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!selectedProject ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
                Select a project above to see its tasks.
              </div>
            ) : tasksLoading ? (
              <div className="rounded-2xl border border-slate-800 p-10 text-center text-slate-400">
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                <h4 className="text-lg font-semibold">No tasks yet</h4>
                <p className="mt-2 text-sm text-slate-400">
                  Add the first task for this project.
                </p>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(true)}
                  className="mt-5 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400"
                >
                  Create first task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`font-semibold ${
                            task.status === 'DONE'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                          {task.description || 'No description provided.'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span
                            className={`rounded-full px-3 py-1 ${
                              task.priority === 'HIGH'
                                ? 'bg-red-500/10 text-red-300'
                                : task.priority === 'LOW'
                                  ? 'bg-slate-700 text-slate-300'
                                  : 'bg-amber-500/10 text-amber-300'
                            }`}
                          >
                            {task.priority} priority
                          </span>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-400">
                            Created{' '}
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="sm:w-44">
                        <label
                          htmlFor={`status-${task.id}`}
                          className="mb-2 block text-xs text-slate-400"
                        >
                          Task status
                        </label>
                        <select
                          id={`status-${task.id}`}
                          value={task.status}
                          onChange={(event) =>
                            void handleStatusChange(
                              task,
                              event.target.value as TaskStatus,
                            )
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-violet-400"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleDeleteTask(task.id)}
                          className="mt-2 w-full rounded-xl border border-red-500/30 px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
                        >
                          Delete task
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

type StatCardProps = {
  label: string
  value: number
  detail: string
}

function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </article>
  )
}

export default App
