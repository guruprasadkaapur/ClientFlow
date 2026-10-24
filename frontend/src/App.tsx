
import { useCallback, useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import {
  createProject,
  getProjects,
  type Project,
} from './services/projects'

function App() {
  const [token, setToken] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const data = await getProjects(token)
      setProjects(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load projects.',
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) void loadProjects()
  }, [token, loadProjects])

  async function handleCreateProject(
    event: React.FormEvent<HTMLFormElement>,
  ) {
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

  if (!token) {
    return <AuthPage onLogin={setToken} />
  }

  const activeProjects = projects.filter(
    (project) => project.status === 'ACTIVE',
  ).length

  const completedProjects = projects.filter(
    (project) => project.status === 'COMPLETED',
  ).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-900/80 p-6 md:block">
        <h1 className="text-2xl font-bold tracking-tight">
          Client<span className="text-violet-400">Flow</span>
        </h1>

        <p className="mt-2 text-xs text-slate-500">
          PROJECT MANAGEMENT
        </p>

        <nav className="mt-10 space-y-2">
          <div className="rounded-xl bg-violet-500/15 px-4 py-3 font-medium text-violet-300">
            Dashboard
          </div>
          <div className="rounded-xl px-4 py-3 text-slate-400">
            Projects
          </div>
          <div className="rounded-xl px-4 py-3 text-slate-400">
            Tasks
          </div>
          <div className="rounded-xl px-4 py-3 text-slate-400">
            Team
          </div>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            type="button"
            onClick={() => {
              setToken(null)
              setProjects([])
            }}
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
                onClick={() => void loadProjects()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {showCreateForm && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-semibold">Create a project</h3>

              <form
                onSubmit={handleCreateProject}
                className="mt-5 space-y-4"
              >
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
              label="Completed"
              value={completedProjects}
              detail="Successfully finished"
            />
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Your projects</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Manage your work from one place.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadProjects()}
                disabled={loading}
                className="text-sm text-violet-300 hover:text-violet-200 disabled:opacity-60"
              >
                Refresh
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
                  <article
                    key={project.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-slate-700"
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
                      Created{' '}
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
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
