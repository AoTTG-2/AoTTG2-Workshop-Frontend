import { z } from "zod";

export function selectError(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Fix the highlighted fields";
  if (error instanceof Error) return error.message;
  return "Create asset failed";
}
