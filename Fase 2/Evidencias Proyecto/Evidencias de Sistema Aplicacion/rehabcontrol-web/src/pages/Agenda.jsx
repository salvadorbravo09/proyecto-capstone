import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth";

const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

function formatDateKey(date) {
  return format(date, "yyyy-MM-dd");
}

function formatTimeKey(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function formatDateLabel(date) {
  return format(date, "dd MMM");
}

function getDisplayName(person) {
  if (!person) return "Sin nombre";
  const name = [person.nombre, person.apellido]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || person.nombre_completo || "Sin nombre";
}

function getCellKey(dateKeyOrDate, time) {
  const dateKeyStr =
    typeof dateKeyOrDate === "string"
      ? dateKeyOrDate
      : formatDateKey(dateKeyOrDate);
  return `${dateKeyStr}-${time}`;
}

function getStateClasses(estado) {
  if (estado === "asistida")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (estado === "cancelada") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function getStatusLabel(estado) {
  if (estado === "asistida") return "Asistida";
  if (estado === "cancelada") return "Cancelada";
  return "Agendada";
}

export default function Agenda() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [kinesiologoId, setKinesiologoId] = useState(null);
  const [kinesiologoName, setKinesiologoName] = useState("");
  const [kinesiologos, setKinesiologos] = useState([]);
  const [adminSelectedKinesiologoId, setAdminSelectedKinesiologoId] =
    useState(null);
  const [patients, setPatients] = useState([]);
  const [citas, setCitas] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPaciente, setFiltroPaciente] = useState("");
  const [formData, setFormData] = useState({
    paciente_id: "",
    fecha: "",
    hora: "09:00",
    motivo_consulta: "",
  });

  useEffect(() => {
    initialize();
  }, []);

  // When admin changes selected kinesiologo, reload patients and citas
  useEffect(() => {
    if (userRole === "admin") {
      // load patients and citas for selected kinesiologo (or all if null)
      loadPatients(adminSelectedKinesiologoId, userRole).catch((err) =>
        console.error(err),
      );
      loadCitas(adminSelectedKinesiologoId, userRole).catch((err) =>
        console.error(err),
      );
    }
  }, [adminSelectedKinesiologoId, userRole]);

  const weekStart = useMemo(() => {
    const now = new Date();
    return addDays(startOfWeek(now, { weekStartsOn: 1 }), weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return dayLabels.map((label, index) => {
      const date = addDays(weekStart, index);
      return {
        label,
        date,
        dateKey: formatDateKey(date),
      };
    });
  }, [weekStart]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekLabel = useMemo(() => {
    return `Semana del ${format(weekStart, "dd 'de' MMMM")} al ${format(
      weekEnd,
      "dd 'de' MMMM, yyyy",
    )}`;
  }, [weekStart, weekEnd]);

  const filteredCitas = useMemo(() => {
    return citas.filter((cita) => {
      const citaDate = parseISO(cita.fecha);
      if (isBefore(citaDate, weekStart) || isAfter(citaDate, weekEnd))
        return false;

      if (filtroEstado && cita.estados?.nombre !== filtroEstado) return false;

      if (filtroPaciente) {
        const q = filtroPaciente.toLowerCase().trim();
        const name =
          `${cita.paciente?.nombre || ""} ${cita.paciente?.apellido || ""}`.toLowerCase();
        if (!name.includes(q)) return false;
      }

      return true;
    });
  }, [citas, weekStart, weekEnd, filtroEstado, filtroPaciente]);

  const citaMap = useMemo(() => {
    const map = new Map();

    for (const cita of filteredCitas) {
      const dayKey = cita.fecha;
      // Agrupamos por hora en punto para que encaje en la cuadrícula (ej: "12:10" -> "12:00")
      const hourBucket = `${String(cita.hora).split(":")[0]}:00`;
      const key = `${dayKey}-${hourBucket}`;
      const existing = map.get(key) || [];
      existing.push(cita);
      map.set(key, existing);
    }

    return map;
  }, [filteredCitas]);

  const selectedPatient = useMemo(() => {
    return (
      patients.find((patient) => patient.id === formData.paciente_id) || null
    );
  }, [patients, formData.paciente_id]);

  const activeFilterCount = [filtroEstado, filtroPaciente].filter(Boolean).length;

  async function initialize() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("No hay sesión activa.");
        return;
      }

      const role = await getUserRole(user.id);
      setUserRole(role);

      let kinId = null;
      let kinName = "";

      if (role === "kinesiologo") {
        const { data: kinData, error: kinError } = await supabase
          .from("kinesiologos")
          .select("id, nombre, apellido")
          .eq("usuario_id", user.id)
          .maybeSingle();

        if (kinError) {
          throw kinError;
        }

        kinId = kinData?.id ?? null;
        kinName = kinData ? getDisplayName(kinData) : "";
      }

      setKinesiologoId(kinId);
      setKinesiologoName(kinName);

      // If admin, preload list of kinesiologos (no selection yet)
      if (role === "admin") {
        const { data: kins = [], error: kinsError } = await supabase
          .from("kinesiologos")
          .select("id, nombre, apellido")
          .order("nombre", { ascending: true });

        if (kinsError) {
          throw kinsError;
        }

        setKinesiologos(kins || []);
      }

      await Promise.all([loadPatients(kinId, role), loadCitas(kinId, role)]);
    } catch (error) {
      console.error("Error initializing agenda:", error);
      setErrorMessage(error.message || "No se pudo cargar la agenda.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPatients(kinId, role) {
    let query = supabase
      .from("pacientes")
      .select("id, nombre, apellido, rut, kinesiologo_asignado_id")
      .order("nombre", { ascending: true });

    // If a specific kinesiologo is provided (admin filter or kinesiologo user), filter patients
    if (kinId) {
      query = query.eq("kinesiologo_asignado_id", kinId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    setPatients(data || []);
  }

  async function loadCitas(kinId, role) {
    let query = supabase
      .from("citas")
      .select(
        `
          id,
          fecha,
          hora,
          estados(nombre),
          motivo_consulta,
          paciente:pacientes(id, nombre, apellido, rut),
          kinesiologo_id
        `,
      )
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    // If kinId provided, filter citas to that kinesiologo. Otherwise admins see all.
    if (kinId) {
      query = query.eq("kinesiologo_id", kinId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    setCitas(data || []);
  }

  function openNewCitaModal() {
    if (userRole === "admin" && kinesiologos.length === 0) {
      setErrorMessage(
        "No hay kinesiólogos cargados. No se puede crear la cita.",
      );
      return;
    }

    const today = format(new Date(), "yyyy-MM-dd");
    setFormData({
      paciente_id: patients[0]?.id || "",
      kinesiologo_id:
        userRole === "admin" ? adminSelectedKinesiologoId || "" : "",
      fecha: today,
      hora: "09:00",
      motivo_consulta: "",
    });
    setErrorMessage("");
    setShowModal(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const now = new Date();
      const fechaCita = new Date(`${formData.fecha}T${formData.hora}`);
      if (fechaCita <= now) {
        throw new Error("La fecha y hora de la cita deben ser futuras.");
      }

      let targetKinesiologoId = kinesiologoId;

      if (userRole === "admin") {
        targetKinesiologoId =
          formData.kinesiologo_id || adminSelectedKinesiologoId;
        if (!targetKinesiologoId) {
          throw new Error("Selecciona un kinesiólogo para la cita.");
        }
      }

      const { data: estadoData } = await supabase
        .from("estados")
        .select("id")
        .eq("entidad", "citas")
        .eq("nombre", "agendada")
        .maybeSingle();

      let estadoId = estadoData?.id;

      if (!estadoId) {
        if (userRole === "admin") {
          const { data: newEstado, error: createError } = await supabase
            .from("estados")
            .insert([{ nombre: "agendada", entidad: "citas" }])
            .select("id")
            .single();

          if (createError) throw new Error("No se pudo crear el estado inicial.");
          estadoId = newEstado.id;
        } else {
          throw new Error(
            "El estado 'agendada' no existe. Solicita al administrador que lo cree desde Configuración."
          );
        }
      }

      const payload = {
        paciente_id: formData.paciente_id,
        kinesiologo_id: targetKinesiologoId,
        fecha: formData.fecha,
        hora: formData.hora,
        motivo_consulta: formData.motivo_consulta.trim() || null,
        estado_id: estadoId,
      };

      const { data: insertedCita, error } = await supabase
        .from("citas")
        .insert([payload])
        .select();

      if (error) {
        throw error;
      }

      if (insertedCita && insertedCita[0]) {
        await supabase.from("estado_historial").insert({
          entidad_tipo: "citas",
          entidad_id: insertedCita[0].id,
          estado_id: estadoId,
          comentario: "Cita agendada inicialmente",
        });
      }

      setShowModal(false);
      // Reload citas using current admin filter (if any) or the kinesiologo id
      const reloadKinId =
        userRole === "admin" ? adminSelectedKinesiologoId : kinesiologoId;
      await loadCitas(reloadKinId, userRole);
    } catch (error) {
      console.error("Error creando cita:", error);
      setErrorMessage(error.message || "No se pudo agendar la cita.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEstado(citaId, nuevoEstado) {
    setCambiandoEstado(citaId);
    setErrorMessage("");
    try {
      const { data: estadoData } = await supabase
        .from("estados")
        .select("id")
        .eq("entidad", "citas")
        .eq("nombre", nuevoEstado)
        .maybeSingle();

      if (!estadoData) throw new Error(`Estado '${nuevoEstado}' no encontrado`);

      const { error } = await supabase
        .from("citas")
        .update({ estado_id: estadoData.id })
        .eq("id", citaId);

      if (error) throw error;

      await supabase.from("estado_historial").insert({
        entidad_tipo: "citas",
        entidad_id: citaId,
        estado_id: estadoData.id,
        comentario: `Cita marcada como '${nuevoEstado}' desde agenda`,
      });

      const reloadKinId =
        userRole === "admin" ? adminSelectedKinesiologoId : kinesiologoId;
      await loadCitas(reloadKinId, userRole);
    } catch (error) {
      console.error("Error cambiando estado:", error);
      setErrorMessage(error.message || "No se pudo cambiar el estado.");
    } finally {
      setCambiandoEstado(null);
    }
  }

  function renderAppointmentsForCell(dateKey, time) {
    const items = citaMap.get(getCellKey(dateKey, time)) || [];

    return items.map((cita) => {
      const estadoNombre = cita.estados?.nombre || "agendada";

      return (
        <div
          key={cita.id}
          className={`rounded-xl border px-3 py-2 text-xs shadow-sm ${getStateClasses(estadoNombre)}`}
        >
          <p className="font-semibold leading-tight text-slate-900">
            {getDisplayName(cita.paciente)}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            {formatTimeKey(cita.hora)} · {cita.motivo_consulta || "Sin motivo"}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-1">
            <span className="text-[11px] font-medium">
              {getStatusLabel(estadoNombre)}
            </span>
            {estadoNombre === "agendada" && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleChangeEstado(cita.id, "asistida")}
                  disabled={cambiandoEstado === cita.id}
                  className="flex size-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                  title="Marcar como asistida"
                >
                  <span className="text-[11px]">✔</span>
                </button>
                <button
                  onClick={() => handleChangeEstado(cita.id, "cancelada")}
                  disabled={cambiandoEstado === cita.id}
                  className="flex size-5 items-center justify-center rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 transition-colors"
                  title="Cancelar cita"
                >
                  <span className="text-[11px]">✕</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
            Agenda
          </h1>
          <p className="text-sm text-slate-500">{weekLabel}</p>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap gap-2">
            {userRole === "admin" ? (
              <select
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none"
                value={adminSelectedKinesiologoId || ""}
                onChange={(e) =>
                  setAdminSelectedKinesiologoId(e.target.value || null)
                }
              >
                <option value="">Todos los kinesiólogos</option>
                {kinesiologos.map((k) => (
                  <option key={k.id} value={k.id}>
                    {getDisplayName(k)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                {kinesiologoName || "Kinesiólogo activo"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className={`gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 ${activeFilterCount > 0 ? "border-[#2B6CB0] text-[#2B6CB0]" : ""}`}
              onClick={() => setShowFiltros(!showFiltros)}
            >
              <Filter className="size-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-[#2B6CB0] px-1.5 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              className="gap-2 bg-[#2B6CB0] hover:bg-[#2C5282]"
              onClick={openNewCitaModal}
            >
              <Plus className="size-4" />
              Nueva cita
            </Button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {showFiltros && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Estado
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["", "agendada", "asistida", "cancelada"].map((est) => (
                  <button
                    key={est}
                    onClick={() =>
                      setFiltroEstado(est === filtroEstado ? "" : est)
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      filtroEstado === est
                        ? est === "agendada"
                          ? "bg-sky-100 text-sky-700"
                          : est === "asistida"
                            ? "bg-emerald-100 text-emerald-700"
                            : est === "cancelada"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {est === ""
                      ? "Todas"
                      : est.charAt(0).toUpperCase() + est.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Paciente
              </label>
              <Input
                placeholder="Buscar por nombre..."
                value={filtroPaciente}
                onChange={(e) => setFiltroPaciente(e.target.value)}
                className="w-48"
              />
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500"
                onClick={() => {
                  setFiltroEstado("");
                  setFiltroPaciente("");
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {userRole === "admin"
                ? "Filtro de kinesiólogo"
                : "Kinesiólogo activo"}
            </p>
            <p className="text-sm text-slate-500">
              {userRole === "admin"
                ? adminSelectedKinesiologoId
                  ? `${kinesiologos.find((k) => k.id === adminSelectedKinesiologoId)?.nombre || "Kinesiólogo"}`
                  : "Todos los kinesiólogos"
                : kinesiologoName || "Sin perfil vinculado"}{" "}
              · {patients.length} pacientes asignados
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <Clock className="size-4" />
            09:00 - 22:00
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Calendario semanal
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-full bg-sky-200" />
                  Agendada
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-full bg-emerald-200" />
                  Asistida
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-full bg-rose-200" />
                  Cancelada
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Solo muestra tus pacientes y tus citas
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="border-slate-200 bg-white"
                onClick={() => setWeekOffset((value) => value - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="border-slate-200 bg-white"
                onClick={() => setWeekOffset((value) => value + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-270 p-6">
            <div className="grid grid-cols-[88px_repeat(7,minmax(140px,1fr))] gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
              <div className="bg-slate-50 px-3 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Hora
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.dateKey}
                  className="bg-slate-50 px-3 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  <div>{day.label}</div>
                  <div className="normal-case tracking-normal">
                    {formatDateLabel(day.date)}
                  </div>
                </div>
              ))}

              {timeSlots.map((time) => (
                <div key={time} className="contents">
                  <div className="flex min-h-14 items-center justify-end bg-slate-50 px-3 text-xs font-medium text-slate-500">
                    {time}
                  </div>

                  {weekDays.map((day) => (
                    <div
                      key={`${day.dateKey}-${time}`}
                      className="min-h-14 bg-white px-2 py-2"
                    >
                      <div className="space-y-2">
                        {renderAppointmentsForCell(day.dateKey, time)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {filteredCitas.length === 0 ? (
              <div className="pointer-events-none mt-6 flex items-center justify-center p-6 text-center">
                <div className="max-w-md rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-900">
                    Sin citas cargadas
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Crea la primera cita con el botón{" "}
                    <span className="font-medium">Nueva cita</span>.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva cita"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {userRole === "admin" ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Kinesiólogo
              </label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#2B6CB0]"
                value={formData.kinesiologo_id || ""}
                onChange={async (event) => {
                  const val = event.target.value || "";
                  setFormData({ ...formData, kinesiologo_id: val });
                  try {
                    await loadPatients(val || null, userRole);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                required
              >
                <option value="">Selecciona un kinesiólogo</option>
                {kinesiologos.map((k) => (
                  <option key={k.id} value={k.id}>
                    {getDisplayName(k)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Paciente
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#2B6CB0]"
              value={formData.paciente_id}
              onChange={(event) =>
                setFormData({ ...formData, paciente_id: event.target.value })
              }
              required
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {getDisplayName(patient)} · {patient.rut || "Sin RUT"}
                </option>
              ))}
            </select>
            {selectedPatient ? (
              <p className="text-xs text-slate-500">
                Se agendará solo para el paciente asignado{" "}
                {getDisplayName(selectedPatient)}.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Fecha
              </label>
              <Input
                type="date"
                value={formData.fecha}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(event) =>
                  setFormData({ ...formData, fecha: event.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Hora</label>
              <Input
                type="time"
                value={formData.hora}
                min={
                  formData.fecha === format(new Date(), "yyyy-MM-dd")
                    ? format(new Date(), "HH:mm")
                    : undefined
                }
                onChange={(event) =>
                  setFormData({ ...formData, hora: event.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Motivo</label>
            <Input
              placeholder="Ej: Control de rodilla"
              value={formData.motivo_consulta}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  motivo_consulta: event.target.value,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#2B6CB0] hover:bg-[#2C5282]"
              disabled={saving}
            >
              {saving ? "Agendando..." : "Agendar cita"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
