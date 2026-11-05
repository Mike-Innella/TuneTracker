import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

const profileSelect = {
  id: true,
  email: true,
  displayName: true,
  profileImageData: true,
  createdAt: true,
  updatedAt: true,
  socialLinks: {
    select: {
      id: true,
      label: true,
      url: true,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
} as const;

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
};

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    const err = Object.assign(new Error('Email already in use'), {
      statusCode: 409,
    });
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      email,
      displayName: input.displayName.trim(),
      passwordHash,
    },
    select: profileSelect,
  });
}

export type LoginInput = {
  email: string;
  password: string;
};

export async function authenticateUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordOk) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: profileSelect,
  });

  if (!profile) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  return profile;
}

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
}

export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      profileImageData: true,
      socialLinks: {
        select: {
          id: true,
          label: true,
          url: true,
        },
        orderBy: {
          createdAt: 'asc' as const,
        },
      },
    },
  });

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
}

export type UpdateProfileInput = {
  displayName?: string;
  profileImageData?: string;
  socialLinks?: Array<{ label: string; url: string }>;
};

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(input.displayName !== undefined
          ? { displayName: input.displayName.trim() }
          : {}),
        ...(input.profileImageData !== undefined
          ? {
              profileImageData: input.profileImageData.trim()
                ? input.profileImageData.trim()
                : null,
            }
          : {}),
      },
    });

    if (input.socialLinks !== undefined) {
      await tx.userSocialLink.deleteMany({
        where: { userId },
      });

      if (input.socialLinks.length > 0) {
        await tx.userSocialLink.createMany({
          data: input.socialLinks.map((link) => ({
            userId,
            label: link.label.trim(),
            url: link.url.trim(),
          })),
        });
      }
    }

    const updated = await tx.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!updated) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    return updated;
  });
}

export async function deleteProfile(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}
