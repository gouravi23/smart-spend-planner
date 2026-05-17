import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

/**
 * CORS FIX (IMPORTANT)
 * Allow your Vercel frontend to talk to Render backend
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://smart-spend-planner.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow mobile apps / curl / server-to-server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
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
 * IMPORTANT:
 * your routes already contain "/auth/..."
 * so this becomes:
 * /api/auth/register
 * /api/auth/login
 */
app.use("/api", router);

export default app;