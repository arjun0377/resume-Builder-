import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100
}));

app.use("/api/v1/users/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10
}));







app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true
}));

app.use(express.json({ limit: "250kb" }));
app.use(express.urlencoded({ extended: true, limit: "250kb" }));
app.use(cookieParser());

import userRouter from  "./src/routes/user.routes.js"
import resumeRouter from "./src/routes/resume.routes.js"

app.use("/api/v1/users" , userRouter)
app.use("/api/v1/resumes" , resumeRouter)

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    statusCode,
    data: null,
    message: err.message || "Something went wrong",
    success: false,
    errors: err.errors || []
  });
});

export default app;
