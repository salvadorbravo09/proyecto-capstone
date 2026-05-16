import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type CreatePacientePayload = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rut?: string | null;
  telefono?: string | null;
  prevision?: string | null;
  fecha_nacimiento?: string | null;
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

  if (roleError || !["admin", "kinesiologo"].includes(roleData?.rol)) {
    return jsonResponse(403, { error: "Admin or kinesiologo access required." });
  }

  let payload: CreatePacientePayload;
  try {
    payload = (await req.json()) as CreatePacientePayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const nombre = payload.nombre?.trim();
  const apellido = payload.apellido?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const rut = payload.rut?.trim();
  const telefono = payload.telefono?.trim();
  const prevision = payload.prevision?.trim();
  const fechaNacimiento = payload.fecha_nacimiento?.trim();

  if (!nombre || !apellido || !email || !password) {
    return jsonResponse(400, { error: "Missing required fields." });
  }

  // Obtener el kinesiologo_id del usuario logueado (si es kinesiologo)
  let kinesiologoId: string | null = null;

  if (roleData.rol === "kinesiologo") {
    const { data: kinData, error: kinError } = await supabaseAdmin
      .from("kinesiologos")
      .select("id")
      .eq("usuario_id", userData.user.id)
      .single();

    if (kinError || !kinData) {
      return jsonResponse(400, { error: "Kinesiologo profile not found." });
    }

    kinesiologoId = kinData.id;
  }

  // Si es admin, puede especificar un kinesiologo_asignado_id opcional
  // Si no se especifica, se crea sin asignación

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { rol: "paciente" },
    });

  if (authError || !authData?.user) {
    return jsonResponse(400, {
      error: authError?.message ?? "Failed to create auth user.",
    });
  }

  const insertPayload: Record<string, unknown> = {
    usuario_id: authData.user.id,
    nombre,
    apellido,
    rut,
    telefono,
    prevision,
    fecha_nacimiento: fechaNacimiento || null,
    email,
  };

  // Si el que crea es kinesiologo, asignar automáticamente
  if (roleData.rol === "kinesiologo" && kinesiologoId) {
    insertPayload.kinesiologo_asignado_id = kinesiologoId;
  }

  const { error: insertError } = await supabaseAdmin
    .from("pacientes")
    .insert([insertPayload]);

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return jsonResponse(400, {
      error: insertError.message,
    });
  }

  // Crear notificación para el kinesiólogo
  if (roleData.rol === "kinesiologo" && kinesiologoId) {
    await supabaseAdmin
      .from("notificaciones")
      .insert([{
        kinesiologo_id: kinesiologoId,
        paciente_id: authData.user.id, // Usamos el usuario_id como referencia
        tipo: "registro_paciente",
        mensaje: `Nuevo paciente registrado: ${nombre} ${apellido}`,
      }]);
  }

  return jsonResponse(200, {
    success: true,
    userId: authData.user.id,
    email,
    nombre: `${nombre} ${apellido}`.trim(),
  });
});
