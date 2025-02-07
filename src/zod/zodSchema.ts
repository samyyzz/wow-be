import { z } from "zod";

export const UserZodSchema = z.object({
  name: z.string().min(3).max(20).optional(),
  email: z.string().email().max(20),
  password: z.string().min(3).max(20),
});

export const ContentZodSchema = z.object({
  type: z.string(),
  title: z.string(),
  link: z.string(),
  tags: z.array(z.string()).optional(),
  favourite: z.boolean(),
  disableCard: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
});

export const disableContentZodSchema = z.object({
  contentId: z.string(),
  disable: z.boolean(),
})

export const favContentZodSchema = z.object({
  contentId: z.string(),
  fav: z.boolean(),
})