
import { apiRequest } from './api'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type TaskPerson = {
  id: string
  name: string
  email: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  projectId: string
  creatorId: string
  assigneeId: string | null
  createdAt: string
  updatedAt: string
  assignee?: TaskPerson | null
  creator?: TaskPerson
}

type TasksResponse = {
  success: boolean
  count: number
  data: Task[]
}

type TaskResponse = {
  success: boolean
  message: string
  data: Task
}

export type CreateTaskInput = {
  title: string
  description?: string
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: string
}

export type UpdateTaskInput = {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  dueDate?: string | null
}

export async function getTasks(
  token: string,
  projectId: string,
): Promise<Task[]> {
  const response = await apiRequest<TasksResponse>(
    `/projects/${projectId}/tasks`,
    { token },
  )

  return response.data
}

export async function createTask(
  token: string,
  projectId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const response = await apiRequest<TaskResponse>(
    `/projects/${projectId}/tasks`,
    {
      method: 'POST',
      token,
      body: input,
    },
  )

  return response.data
}

export async function updateTask(
  token: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const response = await apiRequest<TaskResponse>(
    `/projects/${projectId}/tasks/${taskId}`,
    {
      method: 'PATCH',
      token,
      body: input,
    },
  )
  

  return response.data
}


export async function deleteTask(
  token: string,
  projectId: string,
  taskId: string,
): Promise<void> {
  await apiRequest<{ success: boolean; message: string }>(
    `/projects/${projectId}/tasks/${taskId}`,
    {
      method: 'DELETE',
      token,
    },
  )
}
