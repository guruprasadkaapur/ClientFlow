
import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { logActivity } from "../utils/activityLogger.js";

const router = Router();

router.use(authenticateToken);

const createCommentSchema = z.object({
    content: z.string().trim().min(1).max(3000),
});

// Check project access and confirm the task belongs to that project.
async function findAccessibleTask(projectId, taskId, userId) {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
            ],
        },
        select: { id: true },
    });

    if (!project) {
        return null;
    }

    return prisma.task.findFirst({
        where: {
            id: taskId,
            projectId: project.id,
        },
    });
}

// POST /api/v1/projects/:projectId/tasks/:taskId/comments
router.post(
    "/:projectId/tasks/:taskId/comments",
    validateBody(createCommentSchema),
    async (req, res, next) => {
        try {
            const task = await findAccessibleTask(
                req.params.projectId,
                req.params.taskId,
                req.user.sub
            );

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found or access denied",
                });
            }

            const comment = await prisma.comment.create({
                data: {
                    content: req.body.content,
                    taskId: task.id,
                    userId: req.user.sub,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            await logActivity({
                action: "COMMENT_ADDED",
                description: `Added a comment to task: ${task.id}`,
                actorId: req.user.sub,
                projectId: req.params.projectId,
                taskId: task.id,
            });

            res.status(201).json({
                success: true,
                message: "Comment added successfully",
                data: comment,
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/v1/projects/:projectId/tasks/:taskId/comments
router.get(
    "/:projectId/tasks/:taskId/comments",
    async (req, res, next) => {
        try {
            const task = await findAccessibleTask(
                req.params.projectId,
                req.params.taskId,
                req.user.sub
            );

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task not found or access denied",
                });
            }

            const comments = await prisma.comment.findMany({
                where: {
                    taskId: task.id,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            });

            res.status(200).json({
                success: true,
                count: comments.length,
                data: comments,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
