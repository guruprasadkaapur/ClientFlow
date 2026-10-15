
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate.middleware.js";

const router = Router();

const exampleSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters"),
  email: z.email("Enter a valid email address"),
});

router.post("/validate-example", validateBody(exampleSchema), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Request validation successful",
    data: req.body,
  });
});

export default router;
