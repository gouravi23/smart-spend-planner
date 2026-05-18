import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import expensesRouter from "./expenses";
import budgetRouter from "./budget";
import analyticsRouter from "./analytics";
import gamificationRouter from "./gamification";
import assistantRouter from "./assistant";

const router: IRouter = Router();

router.use(healthRouter);

// ✅ FIXED: auth MUST be mounted under /auth
router.use("/auth", authRouter);

router.use(expensesRouter);
router.use(budgetRouter);
router.use(analyticsRouter);
router.use(gamificationRouter);
router.use(assistantRouter);

export default router;