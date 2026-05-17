import jwt from "jsonwebtoken";

const rawSecret = process.env["SESSION_SECRET"];
if (!rawSecret) throw new Error("SESSION_SECRET environment variable is not set");
const SECRET: string = rawSecret;

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as unknown as { userId: string };
}
