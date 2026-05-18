import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

/**
 * CORS FIX (production-safe)
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://smart-spend-planner.vercel.app",
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / curl
      if (!origin) return callback(null, true);

      // allow exact origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // allow all Vercel deployments (VERY IMPORTANT for previews)
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

/**
 * API routes
 * /api/auth/register
 * /api/auth/login
 */
app.use("/api", router);

export default app;