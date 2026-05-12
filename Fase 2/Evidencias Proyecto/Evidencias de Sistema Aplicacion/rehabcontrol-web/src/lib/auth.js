import { supabase } from "./supabase";

export const allowedRoles = new Set(["admin", "kinesiologo"]);

export function isAllowedRole(role) {
  return allowedRoles.has(role);
}

export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.rol ?? null;
}