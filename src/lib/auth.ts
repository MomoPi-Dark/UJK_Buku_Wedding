import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  getAdminDisplayName,
  getAdminEmail,
  getAdminPasswordHash,
  getAdminSessionSecret,
  getBetterAuthSecret,
  getBetterAuthUrl,
} from "./env";
import { prisma } from "./prisma";

export const auth = betterAuth({
  secret: getBetterAuthSecret(),
  baseURL: getBetterAuthUrl(),
  database: prismaAdapter(prisma, {
    provider: "mysql",
    debugLogs: process.env.NODE_ENV === "development",
  }),
  emailAndPassword: {
    enabled: true,
  },
});

export async function getAdminSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export function getDefaultAdminEmail() {
  return getAdminEmail();
}

export function isDefaultAdminEmail(email: string) {
  return email.trim().toLowerCase() === getDefaultAdminEmail();
}

function isLegacyPasswordMatch(password: string) {
  const digest = createHmac("sha256", getAdminSessionSecret())
    .update(password)
    .digest("hex");

  return timingSafeEqual(
    Buffer.from(digest, "utf8"),
    Buffer.from(getAdminPasswordHash(), "utf8"),
  );
}

export async function bootstrapLegacyAdminLogin(
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim().toLowerCase();

  if (
    !isDefaultAdminEmail(normalizedEmail) ||
    !isLegacyPasswordMatch(password)
  ) {
    return false;
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return false;
  }

  await auth.api.signUpEmail({
    body: {
      name: getAdminDisplayName(),
      email: normalizedEmail,
      password,
    },
  });

  return true;
}
