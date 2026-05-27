import { Router } from "express";
import {
  createResume,
  getUserResumes,
  getResume,
  updateResume,
  deleteResume,
  getShareableResume
} from "../controllers/resume.controller.js";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();

router.route("/")
  .post(verifyJWT, createResume)
  .get(verifyJWT, getUserResumes);

router.route("/:resumeId")
  .get(verifyJWT, getResume)
  .patch(verifyJWT, updateResume)
  .delete(verifyJWT, deleteResume);

router.route("/share/:resumeId").get(getShareableResume);

export default router;