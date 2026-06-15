import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Loader2,
  Bell,
  AlertTriangle,
  Ban,
  FileX,
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth";

export default function Dashboard() {
  const today = new Date();
  const [loading, setLoading] = useState(true);
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasSemana, setCitasSemana] = useState([]);
  const [pacientesActivos, setPacientesActivos] = useState(0);
  const [inasistencias, setInasistencias] = useState(0);
  const [ocupacionData, setOcupacionData] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [kinesiologoId, setKinesiologoId] = useState(null);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const role = await getUserRole(user.id);
      setUserRole(role);

      let kinId = null;
      if (role === "kinesiologo") {
        const { data: kinData } = await supabase
          .from("kinesiologos")
          .select("id")
          .eq("usuario_id", user.id)
          .single();
        if (kinData) {
          kinId = kinData.id;
          setKinesiologoId(kinId);
        }
      }

      const todayStr = format(today, "yyyy-MM-dd");
      const weekStart = format(
        startOfWeek(today, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      const weekEnd = format(
        endOfWeek(today, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );

      let citasQuery = supabase
        .from("citas")
        .select(
          `
          id,
          fecha,
          hora,
          estados(nombre),
          paciente:pacientes(nombre, apellido),
          kinesiologo:kinesiologos(nombre, apellido)
        `,
        )
        .gte("fecha", weekStart)
        .lte("fecha", weekEnd)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true });

      if (role === "kinesiologo" && kinId) {
        citasQuery = citasQuery.eq("kinesiologo_id", kinId);
      }

      const { data: citasData } = await citasQuery;

      if (citasData) {
        const hoy = citasData.filter((c) => c.fecha === todayStr);
        setCitasHoy(hoy);
        setCitasSemana(citasData);

        const ocupacionMap = {};
        const horas = [
          "08:00",
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
        ];
        horas.forEach((h) => (ocupacionMap[h] = 0));

        hoy.forEach((cita) => {
          const horaKey = `${String(cita.hora).split(":")[0]}:00`;
          if (horaKey in ocupacionMap) {
            ocupacionMap[horaKey]++;
          }
        });

        const ocupacion = horas.map((hora) => {
          const count = ocupacionMap[hora];
          return {
            hora,
            ocupacion: count,
            fill: count >= 3 ? "#EF4444" : count === 2 ? "#F59E0B" : "#22C55E",
          };
        });
        setOcupacionData(ocupacion);

        const inasistenciasCount = citasData.filter(
          (c) => c.estados?.nombre === "cancelada",
        ).length;
        setInasistencias(inasistenciasCount);
      }

      let pacientesQuery = supabase
        .from("pacientes")
        .select("*", { count: "exact", head: true });

      if (role === "kinesiologo" && kinId) {
        pacientesQuery = pacientesQuery.eq("kinesiologo_asignado_id", kinId);
      }

      const { count: pacientesCount } = await pacientesQuery;
      setPacientesActivos(pacientesCount || 0);

      // Alertas de pacientes (solo kinesiólogo)
      if (role === "kinesiologo" && kinId) {
        const { data: pacs } = await supabase
          .from("pacientes")
          .select("id, nombre, apellido")
          .eq("kinesiologo_asignado_id", kinId);

        const alertasList = [];

        if (pacs && pacs.length > 0) {
          const { data: planes } = await supabase
            .from("planes_tratamiento")
            .select("id, paciente_id")
            .in("paciente_id", pacs.map(p => p.id))
            .is("fecha_fin", null);

          const pacientesConPlan = new Set((planes || []).map(p => p.paciente_id));

          if (planes && planes.length > 0) {
            const { data: detalles } = await supabase
              .from("plan_detalle")
              .select("id, plan_id")
              .in("plan_id", planes.map(p => p.id));

            const pacientesConEjercicios = new Set();
            if (detalles && detalles.length > 0) {
              const planesConDetalles = new Set(detalles.map(d => d.plan_id));
              for (const plan of planes) {
                if (planesConDetalles.has(plan.id)) {
                  pacientesConEjercicios.add(plan.paciente_id);
                }
              }

              const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

              const { data: progresos } = await supabase
                .from("seguimiento_progreso")
                .select("plan_detalle_id, nivel_dolor, fecha_registro, completado")
                .in("plan_detalle_id", detalles.map(d => d.id))
                .gte("fecha_registro", tresDiasAtras);

              const detalleToPlan = {};
              detalles.forEach(d => { detalleToPlan[d.id] = d.plan_id; });
              const planToPaciente = {};
              planes.forEach(p => { planToPaciente[p.id] = p.paciente_id; });

              const pacienteProgresos = {};
              for (const prog of progresos || []) {
                const planId = detalleToPlan[prog.plan_detalle_id];
                const pacId = planToPaciente[planId];
                if (!pacId) continue;
                if (!pacienteProgresos[pacId]) pacienteProgresos[pacId] = [];
                pacienteProgresos[pacId].push(prog);
              }

              const ahora = new Date();
              const dosDiasMs = 2 * 24 * 60 * 60 * 1000;
              const tresDiasMs = 3 * 24 * 60 * 60 * 1000;

              for (const pac of pacs) {
                if (!pacientesConEjercicios.has(pac.id)) continue;

                const progs = pacienteProgresos[pac.id] || [];

                const highPain = progs.some(p =>
                  ahora.getTime() - new Date(p.fecha_registro).getTime() <= dosDiasMs
                  && p.nivel_dolor >= 7
                );

                const hasRecent = progs.some(p =>
                  ahora.getTime() - new Date(p.fecha_registro).getTime() <= tresDiasMs
                );

                if (highPain) {
                  alertasList.push({
                    tipo: "dolor_alto",
                    paciente: pac,
                    mensaje: "Dolor alto (≥7) en los últimos 2 días",
                  });
                } else if (!hasRecent) {
                  alertasList.push({
                    tipo: "sin_registro",
                    paciente: pac,
                    mensaje: "Sin actividad en los últimos 3 días",
                  });
                }
              }

              // Pacientes con plan activo pero sin ejercicios asignados
              for (const pac of pacs) {
                if (pacientesConPlan.has(pac.id) && !pacientesConEjercicios.has(pac.id)) {
                  alertasList.push({
                    tipo: "sin_ejercicios",
                    paciente: pac,
                    mensaje: "Plan activo sin ejercicios asignados",
                  });
                }
              }
            }
          }

          // Pacientes sin plan de tratamiento activo
          for (const pac of pacs) {
            if (!pacientesConPlan.has(pac.id)) {
              alertasList.push({
                tipo: "sin_plan",
                paciente: pac,
                mensaje: "No tiene un plan de tratamiento activo",
              });
            }
          }
        }

        setAlertas(alertasList);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: "Citas hoy",
      value: loading ? "-" : citasHoy.length,
      icon: Calendar,
      color: "text-[#2B6CB0]",
    },
    {
      label: "Citas esta semana",
      value: loading ? "-" : citasSemana.length,
      icon: TrendingUp,
      color: "text-[#38A169]",
    },
    {
      label: "Pacientes activos",
      value: loading ? "-" : pacientesActivos,
      icon: Users,
      color: "text-[#805AD5]",
    },
    {
      label: "Inasistencias",
      value: loading ? "-" : inasistencias,
      icon: AlertCircle,
      color: "text-[#E53E3E]",
    },
  ];

  const kinesiologoColors = {
    "Dr. López": "#2B6CB0",
    "Dra. Martínez": "#38A169",
    "Dr. García": "#805AD5",
    default: "#64748B",
  };

  const formatKinesiologoNombre = (kinesiologo) => {
    if (!kinesiologo) return "Kinesiólogo";
    const nombre = kinesiologo.nombre || "";
    const apellido = kinesiologo.apellido || "";
    const fullName = `${nombre} ${apellido}`.trim();
    return fullName || "Kinesiólogo";
  };

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="font-semibold text-3xl mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} bg-accent p-3 rounded-lg`}>
                    <Icon className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Citas de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {citasHoy.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="size-12 mx-auto mb-3 opacity-50" />
                  <p>No hay citas programadas para hoy</p>
                </div>
              ) : (
                citasHoy.map((cita) => (
                  <div
                    key={cita.id}
                    className="flex items-center justify-between p-3 bg-accent rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{
                          backgroundColor:
                            kinesiologoColors[
                              formatKinesiologoNombre(cita.kinesiologo)
                            ] || kinesiologoColors.default,
                        }}
                      />
                      <div>
                        <p className="font-medium">
                          {`${cita.paciente?.nombre || ''} ${cita.paciente?.apellido || ''}`.trim() || "Paciente"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cita.hora?.substring(0, 5)} ·{" "}
                          {formatKinesiologoNombre(cita.kinesiologo)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cita.estados?.nombre === "asistida"
                            ? "bg-[#38A169] text-white"
                            : cita.estados?.nombre === "agendada"
                              ? "bg-[#D69E2E] text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cita.estados?.nombre}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Citas de la semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {citasSemana.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="size-12 mx-auto mb-3 opacity-50" />
                  <p>No hay citas esta semana</p>
                </div>
              ) : (
                citasSemana.slice(0, 5).map((cita) => (
                  <div key={cita.id} className="p-3 rounded-lg bg-accent">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {`${cita.paciente?.nombre || ''} ${cita.paciente?.apellido || ''}`.trim() || "Paciente"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(cita.fecha), "EEE d", {
                            locale: es,
                          })}{" "}
                          · {cita.hora?.substring(0, 5)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cita.estados?.nombre === "asistida"
                            ? "bg-[#38A169] text-white"
                            : cita.estados?.nombre === "agendada"
                              ? "bg-[#D69E2E] text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cita.estados?.nombre}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-[#2B6CB0]" />
              Carga horaria — Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ocupacionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hora" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #CBD5E0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} cita${value !== 1 ? "s" : ""}`, "Agendadas"]}
                />
                <Bar dataKey="ocupacion" radius={[6, 6, 0, 0]}>
                  {ocupacionData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-green-500" /> Baja (≤1)</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-amber-500" /> Media (=2)</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-red-500" /> Alta (≥3)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-[#2B6CB0]" />
              Alertas de pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <TrendingUp className="size-10 mb-2 opacity-50" />
                <p className="text-sm font-medium text-slate-500">Todos los pacientes al día</p>
                <p className="text-xs text-slate-400 mt-1">No hay alertas que revisar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertas.map((a, idx) => {
                  const colorMap = {
                    dolor_alto: { border: "border-red-200 bg-red-50", icon: "bg-red-100 text-red-600", Icon: AlertCircle },
                    sin_registro: { border: "border-amber-200 bg-amber-50", icon: "bg-amber-100 text-amber-600", Icon: AlertTriangle },
                    sin_ejercicios: { border: "border-sky-200 bg-sky-50", icon: "bg-sky-100 text-sky-600", Icon: Ban },
                    sin_plan: { border: "border-slate-200 bg-slate-50", icon: "bg-slate-100 text-slate-500", Icon: FileX },
                  };
                  const c = colorMap[a.tipo] || colorMap.sin_registro;
                  const Icon = c.Icon;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${c.border}`}
                    >
                      <div className={`mt-0.5 size-8 rounded-full flex items-center justify-center ${c.icon}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {a.paciente.nombre} {a.paciente.apellido}
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          a.tipo === "dolor_alto" ? "text-red-600"
                          : a.tipo === "sin_registro" ? "text-amber-600"
                          : a.tipo === "sin_ejercicios" ? "text-sky-600"
                          : "text-slate-500"
                        }`}>
                          {a.mensaje}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
