
import express from "express";
import cors from "cors";
import healthRoutes from "./src/routes/health.routes.js";
import {
  notFoundHandler,
  errorHandler,
} from "./src/middleware/error.middleware.js";
import validationRoutes from "./src/routes/validation.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import projectsRoutes from "./src/routes/projects.routes.js";
import membersRoutes from "./src/routes/members.routes.js";
import tasksRoutes from "./src/routes/tasks.routes.js";
import commentsRoutes from "./src/routes/comments.routes.js";
import activitiesRoutes from "./src/routes/activities.routes.js";
// import { logActivity } from "../utils/activityLogger.js";

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.use(express.json());

// API routes
app.use("/api/v1", healthRoutes);
app.use("/api/v1", validationRoutes);
app.use("/api/v1", usersRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectsRoutes);
app.use("/api/v1/projects", membersRoutes);
app.use("/api/v1/projects", tasksRoutes);
app.use("/api/v1/projects", commentsRoutes);
app.use("/api/v1/projects", activitiesRoutes);
// app.use(logActivity);


// console.log("Auth routes registered at /api/v1/auth");
// Handle unmatched routes
app.use(notFoundHandler);

// Handle application errors
app.use(errorHandler);

export default app;
