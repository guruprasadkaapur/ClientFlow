
import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

const router = Router();

router.use(authenticateToken);

const addMemberSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

// Check that the logged-in user owns the project.
async function findOwnedProject(projectId, userId) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });
}

// POST /api/v1/projects/:projectId/members
router.post(
  "/:projectId/members",
  validateBody(addMemberSchema),
  async (req, res, next) => {
    try {
      const project = await findOwnedProject(
        req.params.projectId,
        req.user.sub
      );

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: "Active user not found",
        });
      }

      if (user.id === req.user.sub) {
        return res.status(400).json({
          success: false,
          message: "The project owner is already a project owner",
        });
      }

      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: "User is already a project member",
        });
      }

      const membership = await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: "Project member added successfully",
        data: membership,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/projects/:projectId/members
router.get("/:projectId/members", async (req, res, next) => {
  try {
    const project = await findOwnedProject(
      req.params.projectId,
      req.user.sub
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const members = await prisma.projectMember.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
