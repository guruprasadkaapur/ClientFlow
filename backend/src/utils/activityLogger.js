
import prisma from "../config/prisma.js";

export async function logActivity({
  action,
  description,
  actorId,
  projectId,
  taskId,
}) {
  return prisma.activity.create({
    data: {
      action,
      description,
      actorId,
      projectId,
      ...(taskId ? { taskId } : {}),
    },
  });
}
