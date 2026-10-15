
import { Router } from "express";
import prisma from "../config/prisma.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

// Get activity history for a project
router.get("/:projectId/activities", async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.sub;

    // Only project owners and members can view activity history
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
      return res.status(404).json({
        success: false,
        message: "Project not found or access denied",
      });
    }

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
