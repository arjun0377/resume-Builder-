import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "node:path";
import { fileURLToPath } from "node:url"; 

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientPath = path.join(__dirname, "client");

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

app.use(express.static(clientPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

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
