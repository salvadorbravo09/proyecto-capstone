import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import { Users, Calendar, UserCog, AlertCircle, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    kinesiologos: 0,
    citasMes: 0,
    inasistencias: 0,
  });

  async function fetchStats() {
    setLoading(true);
    try {
      const today = new Date();
      const mesInicio = format(startOfMonth(today), 'yyyy-MM-dd');
      const mesFin = format(endOfMonth(today), 'yyyy-MM-dd');

      const [
        pacientesRes,
        kinesiologosRes,
        citasRes,
        inasistenciasRes
      ] = await Promise.all([
        supabase.from('pacientes').select('*', { count: 'exact', head: true }),
        supabase.from('kinesiologos').select('*', { count: 'exact', head: true }),
        supabase.from('citas').select('*', { count: 'exact', head: true }).gte('fecha', mesInicio).lte('fecha', mesFin),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('estado', 'cancelada').gte('fecha', mesInicio).lte('fecha', mesFin)
      ]);

      setStats({
        pacientes: pacientesRes.count || 0,
        kinesiologos: kinesiologosRes.count || 0,
        citasMes: citasRes.count || 0,
        inasistencias: inasistenciasRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Pacientes",
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
      label: "Citas este mes",
      value: stats.citasMes,
      icon: Calendar,
      color: "text-[#2B6CB0]",
    },
    {
      label: "Inasistencias",
      value: stats.inasistencias,
      icon: AlertCircle,
      color: "text-[#E53E3E]",
    },
  ];

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
        <h1 className="font-semibold text-3xl mb-1">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
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
    </div>
  );
}