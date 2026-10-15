
import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

const router = Router();

// All project routes require authentication.
router.use(authenticateToken);

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).optional(),
});

// POST /api/v1/projects
// Create a project owned by the logged-in user.
router.post("/", validateBody(createProjectSchema), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        ownerId: req.user.sub,
      },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/projects
// List only projects owned by the logged-in user.
router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        ownerId: req.user.sub,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/projects/:id
// Get one project, provided it belongs to the logged-in user.
router.get("/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.sub,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED"]).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update" }
);

// PATCH /api/v1/projects/:id
router.patch(
  "/:id",
  validateBody(updateProjectSchema),
  async (req, res, next) => {
    try {
      const { name, description, status } = req.body;

      // Confirm the project belongs to the logged-in user.
      const existingProject = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          ownerId: req.user.sub,
        },
      });

      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
        });
      }

      const project = await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
        },
      });

      res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/projects/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.sub,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await prisma.project.delete({
      where: { id: existingProject.id },
    });

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});


export default router;
