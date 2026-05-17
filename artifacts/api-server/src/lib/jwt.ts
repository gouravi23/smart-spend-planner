import jwt from "jsonwebtoken";

const SECRET = process.env["SESSION_SECRET"] ?? "smartspend-secret-key";

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}
