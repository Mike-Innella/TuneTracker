import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name is too long"),
});

export type RegisterBody = z.infer<typeof registerSchema>;

// Login Schema is separate because it doesn't require displayName and has different password requirements
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password is too long"),
});

export type LoginBody = z.infer<typeof loginSchema>;

export const publicProfileParamsSchema = z.object({
  userId: z.string().trim().min(1),
});

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display name must be at least 2 characters")
      .max(50, "Display name is too long")
      .optional(),
    profileImageData: z
      .union([
        z
          .string()
          .trim()
          .startsWith("data:image/", "Profile image must be an uploaded image")
          .max(2_000_000, "Profile image is too large"),
        z.literal(""),
      ])
      .optional(),
    socialLinks: z
      .array(
        z.object({
          label: z.string().trim().min(1, "Link label is required").max(40, "Link label is too long"),
          url: z.string().trim().url("Invalid social link URL").max(2048, "Social link URL is too long"),
        })
      )
      .max(10, "Maximum 10 social links")
      .optional(),
  })
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.profileImageData !== undefined ||
      data.socialLinks !== undefined,
    { message: "At least one field is required" }
  );

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
