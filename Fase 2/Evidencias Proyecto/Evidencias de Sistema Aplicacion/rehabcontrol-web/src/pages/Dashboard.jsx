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
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
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
          const horaKey = cita.hora.substring(0, 5);
          if (horaKey in ocupacionMap) {
            ocupacionMap[horaKey]++;
          }
        });

        const ocupacion = horas.map((hora) => ({
          hora,
          ocupacion: ocupacionMap[hora],
        }));
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

      <Card>
        <CardHeader>
          <CardTitle>Ocupación de boxes por hora</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ocupacionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="hora" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #CBD5E0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ocupacion" fill="#2B6CB0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
