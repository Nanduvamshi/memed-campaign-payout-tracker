import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/authRoutes";
import { campaignRoutes } from "./routes/campaignRoutes";
import { submissionRoutes } from "./routes/submissionRoutes";

export const app = express();
const clientOrigin = new URL(env.CLIENT_ORIGIN).origin;

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "32kb" }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/submissions", submissionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
