import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshtoken
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshtoken);

export default router;
