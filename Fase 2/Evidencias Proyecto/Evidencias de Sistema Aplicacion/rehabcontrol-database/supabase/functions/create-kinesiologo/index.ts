import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type CreateKinesiologoPayload = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  especialidad?: string | null;
  registro_minsal?: string | null;
  telefono?: string | null;
  rut?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "Missing Supabase environment configuration." });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) {
    return jsonResponse(401, { error: "Missing authorization token." });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(
    jwt,
  );

  if (userError || !userData?.user) {
    return jsonResponse(401, { error: "Unauthorized user." });
  }

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("usuarios")
    .select("rol")
    .eq("id", userData.user.id)
    .single();

  if (roleError || roleData?.rol !== "admin") {
    return jsonResponse(403, { error: "Admin access required." });
  }

  let payload: CreateKinesiologoPayload;
  try {
    payload = (await req.json()) as CreateKinesiologoPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const nombre = payload.nombre?.trim();
  const apellido = payload.apellido?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const especialidad = payload.especialidad?.trim();
  const registroMinsal = payload.registro_minsal?.trim();
  const telefono = payload.telefono?.trim();
  const rut = payload.rut?.trim();

  if (!nombre || !apellido || !email || !password) {
    return jsonResponse(400, { error: "Missing required fields." });
  }

  if (!especialidad || !registroMinsal || !telefono || !rut) {
    return jsonResponse(400, { error: "Missing required kinesiologo data." });
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { rol: "kinesiologo" },
    });

  if (authError || !authData?.user) {
    return jsonResponse(400, {
      error: authError?.message ?? "Failed to create auth user.",
    });
  }

  const insertPayload = {
    usuario_id: authData.user.id,
    nombre,
    apellido,
    especialidad,
    registro_minsal: registroMinsal,
    telefono,
    rut,
  };

  const { error: insertError } = await supabaseAdmin
    .from("kinesiologos")
    .insert([insertPayload]);

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return jsonResponse(400, {
      error: insertError.message,
    });
  }

  return jsonResponse(200, {
    success: true,
    userId: authData.user.id,
  });
});
