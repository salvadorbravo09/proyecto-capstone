import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, CalendarDays, Activity, TrendingUp, Dumbbell, Edit3, Award, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import PrescripcionModal from "../components/PrescripcionModal";
import { supabase } from "@/lib/supabase";
import { format, parseISO, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

const tabs = [
  { id: "datos", label: "Datos personales", icon: User },
  { id: "historial", label: "Historial de sesiones", icon: Calendar },
  { id: "rutina", label: "Rutina activa", icon: Dumbbell },
  { id: "evolucion", label: "Evolución", icon: TrendingUp },
];

export default function PacienteFicha() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("datos");
  const [rutina, setRutina] = useState(null);
  const [showPrescripcion, setShowPrescripcion] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(true);
  const [paciente, setPaciente] = useState(null);
  const [biblioteca, setBiblioteca] = useState([]);
  const [loadingPaciente, setLoadingPaciente] = useState(true);
  const [kinesiologoId, setKinesiologoId] = useState(null);

  const [evolucionData, setEvolucionData] = useState([]);
  const [evolucionLoading, setEvolucionLoading] = useState(true);
  const [evolucionError, setEvolucionError] = useState(null);
  const [ultimaSemanaCompletado, setUltimaSemanaCompletado] = useState(0);

  useEffect(() => {
    async function init() {
      setLoadingPaciente(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: kinData } = await supabase
          .from("kinesiologos")
          .select("id")
          .eq("usuario_id", user.id)
          .maybeSingle();
        if (kinData) setKinesiologoId(kinData.id);
      }

      const { data: pacData } = await supabase
        .from("pacientes")
        .select("*, previsiones:prevision_id(nombre)")
        .eq("id", id)
        .single();

      if (pacData) {
        const previsionNombre = pacData.previsiones?.nombre || pacData.prevision || "Sin previsión";
        setPaciente({
          id: pacData.id,
          nombre: pacData.nombre || "",
          apellido: pacData.apellido || "",
          rut: pacData.rut || "",
          email: pacData.email || "",
          telefono: pacData.telefono || "",
          fecha_nacimiento: pacData.fecha_nacimiento || "",
          prevision: previsionNombre,
          activo: pacData.activo ?? true,
        });
      }
      setLoadingPaciente(false);

      const { data: ejData } = await supabase
        .from("ejercicios")
        .select("*")
        .order("nombre", { ascending: true });
      setBiblioteca(ejData || []);

      const { data: planData } = await supabase
        .from("planes_tratamiento")
        .select(`
          id,
          fecha_inicio,
          plan_detalle(
            id,
            series,
            repeticiones,
            frecuencia_diaria,
            ejercicio:ejercicios(id, nombre, descripcion, parte_cuerpo)
          )
        `)
        .eq("paciente_id", id)
        .is("fecha_fin", null)
        .order("fecha_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planData) {
        setRutina({
          id: planData.id,
          fecha_inicio: planData.fecha_inicio,
          ejercicios: (planData.plan_detalle || []).map((pd) => ({
            _key: crypto.randomUUID(),
            id: pd.ejercicio.id,
            nombre: pd.ejercicio.nombre,
            descripcion: pd.ejercicio.descripcion || "",
            parte_cuerpo: pd.ejercicio.parte_cuerpo || "",
            series: pd.series,
            repeticiones: pd.repeticiones,
            frecuencia_diaria: pd.frecuencia_diaria,
          })),
        });
      } else {
        setRutina({
          id: null,
          fecha_inicio: new Date().toISOString().split("T")[0],
          ejercicios: [],
        });
      }
    }

    init();
  }, [id]);

  useEffect(() => {
    async function fetchHistorial() {
      setHistorialLoading(true);
      const { data, error } = await supabase
        .from("citas")
        .select(`
          id,
          fecha,
          hora,
          motivo_consulta,
          estados(nombre),
          kinesiologo:kinesiologos(nombre, apellido)
        `)
        .eq("paciente_id", id)
        .order("fecha", { ascending: false })
        .order("hora", { ascending: false });

      if (error) {
        console.error("Error fetching historial:", error);
        setHistorial([]);
      } else {
        setHistorial(
          (data || []).map((c) => ({
            id: c.id,
            fecha: c.fecha,
            hora: c.hora?.slice(0, 5),
            motivo: c.motivo_consulta,
            kinesiologo: [c.kinesiologo?.nombre, c.kinesiologo?.apellido]
              .filter(Boolean)
              .join(" "),
            estado: c.estados?.nombre,
          })),
        );
      }
      setHistorialLoading(false);
    }

    fetchHistorial();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchEvolucion() {
      setEvolucionLoading(true);
      setEvolucionError(null);

      try {
        const { data: plan } = await supabase
          .from("planes_tratamiento")
          .select("id")
          .eq("paciente_id", id)
          .is("fecha_fin", null)
          .maybeSingle();

        if (!plan) {
          if (!cancelled) { setEvolucionData([]); setUltimaSemanaCompletado(0); }
          return;
        }

        const { data: detalles } = await supabase
          .from("plan_detalle")
          .select("id")
          .eq("plan_id", plan.id);

        if (!detalles || detalles.length === 0) {
          if (!cancelled) { setEvolucionData([]); setUltimaSemanaCompletado(0); }
          return;
        }

        const detalleIds = detalles.map(d => d.id);
        const cuatroSemanasAtras = subWeeks(new Date(), 4).toISOString();

        const { data: progresos } = await supabase
          .from("seguimiento_progreso")
          .select("fecha_registro, completado, nivel_dolor")
          .in("plan_detalle_id", detalleIds)
          .gte("fecha_registro", cuatroSemanasAtras)
          .order("fecha_registro", { ascending: true });

        const result = agregarPorSemana(progresos || []);
        if (!cancelled) {
          setEvolucionData(result.data);
          setUltimaSemanaCompletado(result.ultimaSemana);
        }
      } catch (err) {
        console.error("Error fetching evolución:", err);
        if (!cancelled) setEvolucionError(err.message);
      } finally {
        if (!cancelled) setEvolucionLoading(false);
      }
    }

    fetchEvolucion();
    return () => { cancelled = true; };
  }, [id]);

  function agregarPorSemana(progresos) {
    const weekMap = new Map();

    for (const p of progresos) {
      const weekStart = startOfWeek(new Date(p.fecha_registro), { weekStartsOn: 1 });
      const key = weekStart.toISOString().split("T")[0];

      if (!weekMap.has(key)) {
        weekMap.set(key, { weekStart, total: 0, completados: 0, dolorSum: 0, dolorCount: 0 });
      }

      const w = weekMap.get(key);
      w.total++;
      if (p.completado) w.completados++;
      if (p.nivel_dolor != null) {
        w.dolorSum += p.nivel_dolor;
        w.dolorCount++;
      }
    }

    const sorted = [...weekMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-4);

    const weeks = sorted.map(([_, w], idx) => {
      const weekEnd = endOfWeek(w.weekStart, { weekStartsOn: 1 });
      return {
        semana: `Sem ${idx + 1} (${format(w.weekStart, "d MMM", { locale: es })}-${format(weekEnd, "d MMM", { locale: es })})`,
        cumplimiento: Math.round((w.completados / w.total) * 100),
        dolor_promedio: w.dolorCount > 0
          ? Math.round((w.dolorSum / w.dolorCount) * 10) / 10
          : null,
      };
    });

    const ultimaSemana = weeks.length > 0 ? weeks[weeks.length - 1].cumplimiento : 0;
    return { data: weeks, ultimaSemana };
  }

  async function handleSaveRutina(nuevaRutina) {
    if (!kinesiologoId) {
      console.error("No kinesiologo ID found");
      return;
    }

    const planPayload = {
      paciente_id: id,
      kinesiologo_id: kinesiologoId,
      fecha_inicio: nuevaRutina.fecha_inicio || new Date().toISOString().split("T")[0],
    };

    let planId = nuevaRutina.id;

    if (planId) {
      await supabase.from("planes_tratamiento").update(planPayload).eq("id", planId);
    } else {
      const { data: newPlan } = await supabase
        .from("planes_tratamiento")
        .insert([planPayload])
        .select("id")
        .single();
      planId = newPlan?.id;
    }

    if (!planId) return;

    await supabase.from("plan_detalle").delete().eq("plan_id", planId);

    if (nuevaRutina.ejercicios.length > 0) {
      const detalles = nuevaRutina.ejercicios.map((ej) => ({
        plan_id: planId,
        ejercicio_id: ej.id,
        series: ej.series,
        repeticiones: ej.repeticiones,
        frecuencia_diaria: ej.frecuencia_diaria,
      }));

      const { error } = await supabase.from("plan_detalle").insert(detalles);
      if (error) throw error;
    }

    const { data: refreshedPlan } = await supabase
      .from("planes_tratamiento")
      .select(`
        id,
        fecha_inicio,
        plan_detalle(
          id,
          series,
          repeticiones,
          frecuencia_diaria,
          ejercicio:ejercicios(id, nombre, descripcion, parte_cuerpo)
        )
      `)
      .eq("id", planId)
      .single();

    if (refreshedPlan) {
      setRutina({
        id: refreshedPlan.id,
        fecha_inicio: refreshedPlan.fecha_inicio,
        ejercicios: (refreshedPlan.plan_detalle || []).map((pd) => ({
          _key: crypto.randomUUID(),
          id: pd.ejercicio.id,
          nombre: pd.ejercicio.nombre,
          descripcion: pd.ejercicio.descripcion || "",
          parte_cuerpo: pd.ejercicio.parte_cuerpo || "",
          series: pd.series,
          repeticiones: pd.repeticiones,
          frecuencia_diaria: pd.frecuencia_diaria,
        })),
      });
    }

    setShowPrescripcion(false);
  }

  if (loadingPaciente) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <p className="text-slate-500">Paciente no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver a pacientes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {paciente.nombre} {paciente.apellido}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {paciente.rut} · {paciente.prevision}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {paciente.activo ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200">
                <Activity className="size-3.5" />
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200">
                <Activity className="size-3.5" />
                Inactivo
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                const confirmar = confirm(
                  `¿${paciente.activo ? "Desactivar" : "Reactivar"} a ${paciente.nombre} ${paciente.apellido}?${
                    paciente.activo ? " El paciente no podrá acceder a la app móvil." : ""
                  }`,
                );
                if (!confirmar) return;
                const { error } = await supabase
                  .from("pacientes")
                  .update({ activo: !paciente.activo })
                  .eq("id", paciente.id);
                if (!error) {
                  setPaciente((prev) => ({ ...prev, activo: !prev.activo }));
                }
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                paciente.activo
                  ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                  : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              {paciente.activo ? "Desactivar" : "Reactivar"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#2B6CB0] text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tab: Datos personales */}
        {activeTab === "datos" && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Información del paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <User className="size-4" />
                  Nombre completo
                </div>
                <p className="font-medium text-slate-900">{paciente.nombre} {paciente.apellido}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Award className="size-4" />
                  RUT
                </div>
                <p className="font-medium text-slate-900">{paciente.rut}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Mail className="size-4" />
                  Email
                </div>
                <p className="font-medium text-slate-900">{paciente.email}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Phone className="size-4" />
                  Teléfono
                </div>
                <p className="font-medium text-slate-900">{paciente.telefono}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <CalendarDays className="size-4" />
                  Fecha de nacimiento
                </div>
                <p className="font-medium text-slate-900">
                  {paciente.fecha_nacimiento
                    ? format(parseISO(paciente.fecha_nacimiento), "dd MMMM yyyy", { locale: es })
                    : "No registrada"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Activity className="size-4" />
                  Previsión
                </div>
                <p className="font-medium text-slate-900">{paciente.prevision}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Historial de sesiones */}
        {activeTab === "historial" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Historial de sesiones</h2>
            {historialLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-[#2B6CB0]" />
              </div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No hay sesiones registradas.</p>
            ) : (
              <div className="space-y-4">
                {historial.map((sesion) => {
                  const estadoColor =
                    sesion.estado === "asistida"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : sesion.estado === "cancelada"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : "bg-sky-50 text-sky-600 border-sky-200";
                  return (
                    <div
                      key={sesion.id}
                      className="relative rounded-xl border border-slate-200 bg-white p-4 pl-8 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 before:-translate-x-1/2 before:last:hidden"
                    >
                      <div className="absolute left-4 top-4 size-3 -translate-x-1/2 rounded-full bg-[#2B6CB0] ring-4 ring-white" />
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">{sesion.motivo || "Sin motivo"}</p>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              {format(parseISO(sesion.fecha), "dd MMM yyyy", { locale: es })}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {sesion.hora}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
                            {sesion.kinesiologo}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${estadoColor}`}>
                            {sesion.estado === "asistida"
                              ? "Asistida"
                              : sesion.estado === "cancelada"
                                ? "Cancelada"
                                : "Agendada"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Rutina activa */}
        {activeTab === "rutina" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Rutina activa</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {rutina?.fecha_inicio
                    ? `Desde el ${format(parseISO(rutina.fecha_inicio), "dd MMM yyyy", { locale: es })}`
                    : "Sin rutina asignada"}
                </p>
              </div>
              <Button
                className="bg-[#2B6CB0] hover:bg-[#2C5282] gap-2"
                onClick={() => setShowPrescripcion(true)}
              >
                <Edit3 className="size-4" />
                Editar rutina
              </Button>
            </div>

            {!rutina || rutina.ejercicios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Dumbbell className="size-12 mb-3 opacity-50" />
                <p className="text-sm font-medium text-slate-500">Sin ejercicios asignados</p>
                <p className="text-xs text-slate-400 mt-1">Presiona "Editar rutina" para prescribir ejercicios.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rutina.ejercicios.map((ej, index) => (
                  <div
                    key={ej._key}
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-[#2B6CB0]">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{ej.nombre}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{ej.descripcion}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {ej.parte_cuerpo}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-slate-500">Series: </span>
                        <span className="font-semibold text-slate-900">{ej.series}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-slate-500">Repeticiones: </span>
                        <span className="font-semibold text-slate-900">{ej.repeticiones}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-slate-500">Frecuencia: </span>
                        <span className="font-semibold text-slate-900">{ej.frecuencia_diaria}x/día</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Evolución */}
        {activeTab === "evolucion" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Evolución del tratamiento</h2>

            {evolucionLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-[#2B6CB0]" />
              </div>
            ) : evolucionError ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <AlertCircle className="size-12 mb-3 opacity-50 text-rose-400" />
                <p className="text-sm font-medium text-slate-500">Error al cargar la evolución</p>
                <p className="text-xs text-slate-400 mt-1">Intenta recargar la página.</p>
              </div>
            ) : evolucionData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <TrendingUp className="size-12 mb-3 opacity-50" />
                <p className="text-sm font-medium text-slate-500">Sin datos de evolución</p>
                <p className="text-xs text-slate-400 mt-1">No hay registros de progreso en las últimas 4 semanas.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-medium text-slate-500 mb-4">Cumplimiento semanal</h3>
                    <div className="space-y-3">
                      {evolucionData.map((sem) => (
                        <div key={sem.semana}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">{sem.semana}</span>
                            <span className="font-semibold text-slate-900">{sem.cumplimiento}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#2B6CB0] to-cyan-400 transition-all"
                              style={{ width: `${sem.cumplimiento}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-medium text-slate-500 mb-4">Dolor promedio semanal</h3>
                    <div className="space-y-3">
                      {evolucionData.map((sem) => {
                        const dolorVal = sem.dolor_promedio;
                        const dolorColor = dolorVal != null
                          ? dolorVal <= 3
                            ? "text-emerald-600 bg-emerald-50"
                            : dolorVal <= 6
                              ? "text-amber-600 bg-amber-50"
                              : "text-rose-600 bg-rose-50"
                          : "text-slate-400 bg-slate-50";
                        return (
                          <div key={sem.semana} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{sem.semana}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${dolorColor}`}>
                              <AlertCircle className="size-3" />
                              {dolorVal != null ? `${dolorVal}/10` : "--"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {ultimaSemanaCompletado > 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span>
                        El paciente ha completado el <strong>{ultimaSemanaCompletado}%</strong> de su rutina en la última semana.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Prescripcion Modal */}
      {showPrescripcion && rutina && (
        <PrescripcionModal
          paciente={paciente}
          rutina={rutina}
          biblioteca={biblioteca}
          onSave={handleSaveRutina}
          onClose={() => setShowPrescripcion(false)}
        />
      )}
    </div>
  );
}
