import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret"
);

export interface UserPayload {
  id: number;
  employeeId: string;
  name: string;
  role: string;
  departmentId?: number;
  sessionId?: string;
  mustChangePassword?: boolean;
}

export async function createToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { sessionId: true, mustChangePassword: true },
  });
  if (!user || user.sessionId !== payload.sessionId) return null;
  return { ...payload, mustChangePassword: user.mustChangePassword ?? false };
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "mail_dept":
      return "قسم البريد";
    case "other_dept":
      return "قسم آخر";
    case "admin":
      return "مدير النظام";
    default:
      return role;
  }
}
