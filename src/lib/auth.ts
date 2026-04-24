import { createHmac, randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAdminPasswordHash, getAdminSessionSecret, getAdminUsername, getBetterAuthUrl } from "@/lib/env";

function normalizeAdminUsername(usernameValue: string): string {
  return usernameValue.trim().toLowerCase();
}

function getAdminIdentity() {
  const usernameValue = getAdminUsername().trim();
  const normalizedUsername = normalizeAdminUsername(usernameValue);

  return {
    username: usernameValue,
    normalizedUsername,
    email: `${normalizedUsername}@admin.local`,
    name: "Admin TU MAN 2",
  };
}

function hashLegacyAdminPassword(password: string): string {
  return createHmac("sha256", getAdminSessionSecret()).update(password).digest("hex");
}

export const auth = betterAuth({
  secret: getAdminSessionSecret(),
  baseURL: getBetterAuthUrl(),
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: async (password) => hashLegacyAdminPassword(password),
      verify: async ({ hash, password }) => hash === hashLegacyAdminPassword(password),
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 120,
      usernameNormalization: (value) => normalizeAdminUsername(value),
      usernameValidator: (value) => normalizeAdminUsername(value) === getAdminIdentity().normalizedUsername,
    }),
    nextCookies(),
  ],
});

async function upsertAdminAccount() {
  const identity = getAdminIdentity();
  const passwordHash = getAdminPasswordHash();

  await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: identity.email },
      select: { id: true },
    });

    const user = existingUser
      ? await tx.user.update({
          where: { email: identity.email },
          data: {
            name: identity.name,
            emailVerified: true,
            username: identity.normalizedUsername,
            displayUsername: identity.username,
          },
          select: {
            id: true,
          },
        })
      : await tx.user.create({
          data: {
            id: randomUUID(),
            name: identity.name,
            email: identity.email,
            emailVerified: true,
            username: identity.normalizedUsername,
            displayUsername: identity.username,
          },
          select: {
            id: true,
          },
        });

    const existingAccount = await tx.account.findFirst({
      where: {
        providerId: "credential",
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    if (existingAccount) {
      await tx.account.update({
        where: {
          id: existingAccount.id,
        },
        data: {
          accountId: identity.email,
          password: passwordHash,
        },
      });
      return;
    }

    await tx.account.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        providerId: "credential",
        accountId: identity.email,
        password: passwordHash,
      },
    });
  });
}

export async function ensureAdminUser() {
  await upsertAdminAccount();
}

export async function getAdminSession() {
  await ensureAdminUser();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return session.user.email === getAdminIdentity().email ? session : null;
}
