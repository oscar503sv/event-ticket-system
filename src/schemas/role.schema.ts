import { z } from "zod";

export const RoleEnum = z.enum(["USER", "ORGANIZER", "VALIDATOR", "ADMIN"]);
export type Role = z.infer<typeof RoleEnum>;

export const DEFAULT_ROLE = "USER";
