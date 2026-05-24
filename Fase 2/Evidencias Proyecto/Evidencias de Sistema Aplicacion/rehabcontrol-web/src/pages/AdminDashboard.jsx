import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import {
  Users,
  Calendar,
  UserCog,
  AlertCircle,
  Loader2,
  Clock3,
  CircleCheckBig,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    kinesiologos: 0,
    citasMes: 0,
    citasHoy: 0,
    citasPendientes: 0,
    citasAsistidas: 0,
    inasistencias: 0,
    pacientesActivosSemana: 0,
    citasSemana: [],
    proximasCitas: [],
  });

  async function fetchStats() {
    try {
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const weekStart = format(
        startOfWeek(today, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      const weekEnd = format(
        endOfWeek(today, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      const mesInicio = format(startOfMonth(today), "yyyy-MM-dd");
      const mesFin = format(endOfMonth(today), "yyyy-MM-dd");

      const [
        pacientesRes,
        kinesiologosRes,
        citasMesRes,
        inasistenciasRes,
        citasSemanaRes,
        proximasCitasRes,
        citasPendientesRes,
        citasAsistidasRes,
      ] = await Promise.all([
        supabase.from("pacientes").select("*", { count: "exact", head: true }),
        supabase
          .from("kinesiologos")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("citas")
          .select("*", { count: "exact", head: true })
          .gte("fecha", mesInicio)
          .lte("fecha", mesFin),
        supabase
          .from("citas")
          .select("*, estados!inner(nombre)", { count: "exact", head: true })
          .eq("estados.nombre", "cancelada")
          .gte("fecha", mesInicio)
          .lte("fecha", mesFin),
        supabase
          .from("citas")
          .select(
            `
            id,
            fecha,
            hora,
            estados(nombre),
            paciente_id,
            paciente:pacientes(nombre, apellido),
            kinesiologo:kinesiologos(nombre, apellido)
          `,
          )
          .gte("fecha", weekStart)
          .lte("fecha", weekEnd)
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true }),
        supabase
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
          .gte("fecha", todayStr)
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true })
          .limit(5),
        supabase
          .from("citas")
          .select("*, estados!inner(nombre)", { count: "exact", head: true })
          .eq("estados.nombre", "agendada")
          .gte("fecha", mesInicio)
          .lte("fecha", mesFin),
        supabase
          .from("citas")
          .select("*, estados!inner(nombre)", { count: "exact", head: true })
          .eq("estados.nombre", "asistida")
          .gte("fecha", mesInicio)
          .lte("fecha", mesFin),
      ]);

      const citasSemana = citasSemanaRes.data || [];
      const citasHoy = citasSemana.filter(
        (cita) => cita.fecha === todayStr,
      ).length;

      const diasSemana = eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      });

      const actividadSemana = diasSemana.map((dia) => ({
        dia: format(dia, "EEE", { locale: es }),
        fecha: format(dia, "yyyy-MM-dd"),
        citas: citasSemana.filter((cita) =>
          isSameDay(new Date(`${cita.fecha}T00:00:00`), dia),
        ).length,
      }));

      const pacientesActivosSemana = new Set(
        citasSemana.map((cita) => cita.paciente_id).filter(Boolean),
      ).size;

      setStats({
        pacientes: pacientesRes.count || 0,
        kinesiologos: kinesiologosRes.count || 0,
        citasMes: citasMesRes.count || 0,
        citasHoy,
        citasPendientes: citasPendientesRes.count || 0,
        citasAsistidas: citasAsistidasRes.count || 0,
        inasistencias: inasistenciasRes.count || 0,
        pacientesActivosSemana,
        citasSemana: actividadSemana,
        proximasCitas: proximasCitasRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStats();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const statCards = [
    {
      label: "Pacientes totales",
      value: stats.pacientes,
      icon: Users,
      color: "text-[#805AD5]",
    },
    {
      label: "Kinesiólogos",
      value: stats.kinesiologos,
      icon: UserCog,
      color: "text-[#38A169]",
    },
    {
      label: "Citas hoy",
      value: stats.citasHoy,
      icon: Clock3,
      color: "text-[#2B6CB0]",
    },
    {
      label: "Citas mes",
      value: stats.citasMes,
      icon: Calendar,
      color: "text-[#0F766E]",
    },
    {
      label: "Pendientes",
      value: stats.citasPendientes,
      icon: Calendar,
      color: "text-[#D97706]",
    },
    {
      label: "Asistidas",
      value: stats.citasAsistidas,
      icon: CircleCheckBig,
      color: "text-[#16A34A]",
    },
    {
      label: "Inasistencias",
      value: stats.inasistencias,
      icon: AlertCircle,
      color: "text-[#E53E3E]",
    },
    {
      label: "Pacientes activos",
      value: stats.pacientesActivosSemana,
      icon: TrendingUp,
      color: "text-[#7C3AED]",
    },
  ];

  const statCardsTop = statCards.slice(0, 4);
  const statCardsBottom = statCards.slice(4);

  const maxActivity = useMemo(
    () => Math.max(...stats.citasSemana.map((item) => item.citas), 1),
    [stats.citasSemana],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-semibold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          Resumen ejecutivo del panel
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">
            Resumen de actividad
          </h3>
          <p className="text-sm text-muted-foreground">
            Pacientes, profesionales y citas del mes
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCardsTop.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-semibold">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} rounded-lg bg-accent p-3`}>
                      <Icon className="size-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-900">
            Estados de atención
          </h3>
          <p className="text-sm text-muted-foreground">
            Seguimiento de pendientes, asistidas e inasistencias
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCardsBottom.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-semibold">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} rounded-lg bg-accent p-3`}>
                      <Icon className="size-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Actividad semanal
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Citas por día
                </h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Semana actual
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {stats.citasSemana.map((day) => {
                const height = `${Math.max((day.citas / maxActivity) * 100, day.citas > 0 ? 18 : 8)}%`;

                return (
                  <div
                    key={day.fecha}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="flex h-44 w-full items-end rounded-2xl bg-slate-50 p-2">
                      <div
                        className="w-full rounded-xl bg-linear-to-t from-[#2B6CB0] to-cyan-400 transition-all"
                        style={{ height }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {day.dia}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {day.citas}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Próximas citas
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Agenda inmediata
                  </h2>
                </div>
                <Activity className="size-5 text-[#2B6CB0]" />
              </div>

              <div className="space-y-4">
                {stats.proximasCitas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay citas próximas registradas.
                  </p>
                ) : (
                  stats.proximasCitas.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {cita.paciente?.nombre} {cita.paciente?.apellido}
                        </p>
                        <p className="text-xs text-slate-500">
                          {cita.kinesiologo?.nombre}{" "}
                          {cita.kinesiologo?.apellido}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {cita.fecha}
                        </p>
                        <p className="text-xs text-slate-500">{cita.hora}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Alertas rápidas
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Estados a revisar
                  </h2>
                </div>
                <AlertCircle className="size-5 text-[#E53E3E]" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-2xl font-semibold text-amber-700">
                    {stats.citasPendientes}
                  </p>
                  <p className="text-xs text-amber-700/80">Pendientes</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-2xl font-semibold text-emerald-700">
                    {stats.citasAsistidas}
                  </p>
                  <p className="text-xs text-emerald-700/80">Asistidas</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-2xl font-semibold text-rose-700">
                    {stats.inasistencias}
                  </p>
                  <p className="text-xs text-rose-700/80">Canceladas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
