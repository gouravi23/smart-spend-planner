import { Router } from "express";
import { User } from "../models/User";
import { signToken } from "../lib/jwt";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { Response } from "express";

const router = Router();

/**
 * Mounted as:
 * app.use("/api", router)
 */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({
        error: "Email already registered",
      });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = signToken(user._id.toString());

    return res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const valid = await user.comparePassword(password);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = signToken(user._id.toString());

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "GetMe error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;