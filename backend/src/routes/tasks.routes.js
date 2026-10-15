
import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { logActivity } from "../utils/activityLogger.js";

const router = Router();

router.use(authenticateToken);

const createTaskSchema = z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(5000).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    assigneeId: z.uuid().optional(),
    dueDate: z.iso.datetime().optional(),
});

const updateTaskSchema = z.object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    assigneeId: z.uuid().nullable().optional(),
    dueDate: z.iso.datetime().nullable().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update" }
);

// The owner or a project member may access the project's tasks.
async function findAccessibleProject(projectId, userId) {
    return prisma.project.findFirst({
        where: {
            id: projectId,
            OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
            ],
        },
    });
}

// POST /api/v1/projects/:projectId/tasks
router.post(
    "/:projectId/tasks",
    validateBody(createTaskSchema),
    async (req, res, next) => {
        try {
            const project = await findAccessibleProject(
                req.params.projectId,
                req.user.sub
            );

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found or access denied",
                });
            }

            const { title, description, priority, assigneeId, dueDate } = req.body;

            if (assigneeId) {
                const isOwner = project.ownerId === assigneeId;
                const isMember = await prisma.projectMember.findUnique({
                    where: {
                        projectId_userId: {
                            projectId: project.id,
                            userId: assigneeId,
                        },
                    },
                });

                if (!isOwner && !isMember) {
                    return res.status(400).json({
                        success: false,
                        message: "Assignee must be the project owner or a project member",
                    });
                }
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    description,
                    priority,
                    assigneeId,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    projectId: project.id,
                    creatorId: req.user.sub,
                },
                include: {
                    assignee: {
                        select: { id: true, name: true, email: true },
                    },
                },
            });
            await logActivity({
                action: "TASK_CREATED",
                description: `Created task: ${task.title}`,
                actorId: req.user.sub,
                projectId: task.projectId,
                taskId: task.id,
            });

            res.status(201).json({
                success: true,
                message: "Task created successfully",
                data: task,
            });
        } catch (error) {
            next(error);
        }
    }
);



// GET /api/v1/projects/:projectId/tasks
router.get("/:projectId/tasks", async (req, res, next) => {
    try {
        const project = await findAccessibleProject(
            req.params.projectId,
            req.user.sub
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied",
            });
        }

        const tasks = await prisma.task.findMany({
            where: { projectId: project.id },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true },
                },
                creator: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks,
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/v1/projects/:projectId/tasks/:taskId
router.patch(
    "/:projectId/tasks/:taskId",
    validateBody(updateTaskSchema),
    async (req, res, next) => {
        try {
            const project = await findAccessibleProject(
                req.params.projectId,
                req.user.sub
            );

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found or access denied",
                });
            }

            const existingTask = await prisma.task.findFirst({
                where: {
                    id: req.params.taskId,
                    projectId: project.id,
                },
            });

            if (!existingTask) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found",
                });
            }

            const { assigneeId, dueDate, ...otherFields } = req.body;

            if (assigneeId) {
                const isOwner = project.ownerId === assigneeId;
                const isMember = await prisma.projectMember.findUnique({
                    where: {
                        projectId_userId: {
                            projectId: project.id,
                            userId: assigneeId,
                        },
                    },
                });

                if (!isOwner && !isMember) {
                    return res.status(400).json({
                        success: false,
                        message: "Assignee must be the project owner or a project member",
                    });
                }
            }

            const task = await prisma.task.update({
                where: { id: existingTask.id },
                data: {
                    ...otherFields,
                    ...(assigneeId !== undefined && { assigneeId }),
                    ...(dueDate !== undefined && {
                        dueDate: dueDate === null ? null : new Date(dueDate),
                    }),
                },
            });
            await logActivity({
                action: "TASK_UPDATED",
                description: `Updated task: ${task.title}`,
                actorId: req.user.sub,
                projectId: task.projectId,
                taskId: task.id,
            });

            res.status(200).json({
                success: true,
                message: "Task updated successfully",
                data: task,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
