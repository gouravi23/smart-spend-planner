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
router.use(authRouter);
router.use(expensesRouter);
router.use(budgetRouter);
router.use(analyticsRouter);
router.use(gamificationRouter);
router.use(assistantRouter);

export default router;
