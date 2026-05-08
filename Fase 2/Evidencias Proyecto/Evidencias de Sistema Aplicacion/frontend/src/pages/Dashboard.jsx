import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Users, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const today = new Date();

  // Mock data for dashboard stats
  const citasHoy = []; 
  const citasSemana = [];
  const pacientesActivos = 0;

  const stats = [
    { label: 'Citas hoy', value: citasHoy.length, icon: Calendar, color: 'text-[#2B6CB0]' },
    { label: 'Citas esta semana', value: citasSemana.length, icon: TrendingUp, color: 'text-[#38A169]' },
    { label: 'Pacientes activos', value: pacientesActivos, icon: Users, color: 'text-[#805AD5]' },
    { label: 'Inasistencias', value: 0, icon: AlertCircle, color: 'text-[#E53E3E]' },
  ];

  return (
    <div>
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
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
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
