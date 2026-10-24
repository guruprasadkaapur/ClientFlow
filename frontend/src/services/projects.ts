
import { apiRequest } from './api'

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'

export type Project = {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  ownerId: string
  createdAt: string
  updatedAt: string
}

type ProjectsResponse = {
  success: boolean
  count: number
  data: Project[]
}

type ProjectResponse = {
  success: boolean
  message?: string
  data: Project
}

export type CreateProjectInput = {
  name: string
  description?: string
}

export async function getProjects(token: string): Promise<Project[]> {
  const response = await apiRequest<ProjectsResponse>('/projects', {
    token,
  })

  return response.data
}

export async function createProject(
  token: string,
  input: CreateProjectInput,
): Promise<Project> {
  const response = await apiRequest<ProjectResponse>('/projects', {
    method: 'POST',
    token,
    body: input,
  })

  return response.data
}

export async function updateProject(
  token: string,
  projectId: string,
  input: Partial<CreateProjectInput> & { status?: ProjectStatus },
): Promise<Project> {
  const response = await apiRequest<ProjectResponse>(
    `/projects/${projectId}`,
    {
      method: 'PATCH',
      token,
      body: input,
    },
  )

  return response.data
}

export async function deleteProject(
  token: string,
  projectId: string,
): Promise<void> {
  await apiRequest<{ success: boolean; message: string }>(
    `/projects/${projectId}`,
    {
      method: 'DELETE',
      token,
    },
  )
}
