import { useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  Clock3,
  CircleCheckBig,
  CalendarX2,
  CalendarRange,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const citasMock = [
  {
    id: 1,
    paciente: "Camila Torres",
    rut: "18.234.567-8",
    kinesiologo: "Valentina Rojas",
    fecha: "19 may 2026",
    hora: "09:00",
    motivo: "Control de rodilla",
    estado: "Confirmada",
  },
  {
    id: 2,
    paciente: "Javier Muñoz",
    rut: "15.678.901-2",
    kinesiologo: "Diego Pérez",
    fecha: "19 may 2026",
    hora: "10:30",
    motivo: "Evaluación inicial",
    estado: "Pendiente",
  },
  {
    id: 3,
    paciente: "Andrea Soto",
    rut: "17.456.789-0",
    kinesiologo: "Fernanda López",
    fecha: "20 may 2026",
    hora: "11:00",
    motivo: "Seguimiento funcional",
    estado: "Confirmada",
  },
  {
    id: 4,
    paciente: "Rodrigo Salazar",
    rut: "14.908.776-5",
    kinesiologo: "Camila Vega",
    fecha: "20 may 2026",
    hora: "15:00",
    motivo: "Revisión de ejercicios",
    estado: "Cancelada",
  },
  {
    id: 5,
    paciente: "Valeria Díaz",
    rut: "19.001.223-4",
    kinesiologo: "Martín Herrera",
    fecha: "21 may 2026",
    hora: "08:30",
    motivo: "Terapia de mantenimiento",
    estado: "Pendiente",
  },
];

const resumen = [
  {
    label: "Citas totales",
    value: "128",
    icon: CalendarDays,
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    label: "Confirmadas",
    value: "82",
    icon: CircleCheckBig,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Pendientes",
    value: "31",
    icon: Clock3,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    label: "Canceladas",
    value: "15",
    icon: CalendarX2,
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

const filtros = ["Todas", "Confirmadas", "Pendientes", "Canceladas"];

function getEstadoClasses(estado) {
  if (estado === "Confirmada") {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  }

  if (estado === "Pendiente") {
    return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }

  return "bg-rose-500/20 text-rose-300 border-rose-500/30";
}

export default function AdminCitas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");

  const citasFiltradas = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return citasMock.filter((cita) => {
      const matchesSearch =
        !query ||
        [
          cita.paciente,
          cita.rut,
          cita.kinesiologo,
          cita.fecha,
          cita.hora,
          cita.motivo,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        activeFilter === "Todas" || cita.estado === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
          Citas Admin
        </h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Vista de control para revisar citas registradas, filtrar su estado y
          acceder rápidamente a cada reserva.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resumen.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-xl p-2 ${item.bg}`}>
                  <Icon className={`size-4 ${item.accent}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por paciente, RUT, kinesiólogo, fecha o motivo..."
              className="border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filtros.map((filtro) => (
              <Button
                key={filtro}
                type="button"
                variant={activeFilter === filtro ? "default" : "ghost"}
                className={
                  activeFilter === filtro
                    ? "bg-[#2B6CB0] hover:bg-[#2C5282]"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }
                onClick={() => setActiveFilter(filtro)}
              >
                {filtro}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Listado de citas
              </h2>
              <p className="text-sm text-slate-500">
                Citas registradas en el sistema con información principal.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {citasFiltradas.length} resultados
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-280">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Paciente</th>
                <th className="px-6 py-4 font-medium">RUT</th>
                <th className="px-6 py-4 font-medium">Kinesiólogo</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Hora</th>
                <th className="px-6 py-4 font-medium">Motivo</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {citasFiltradas.map((cita) => (
                <tr
                  key={cita.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-sm">
                        {cita.paciente.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {cita.paciente}
                        </p>
                        <p className="text-sm text-slate-500">
                          Cita programada
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {cita.rut}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {cita.kinesiologo}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {cita.fecha}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {cita.hora}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {cita.motivo}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getEstadoClasses(cita.estado)}`}
                    >
                      {cita.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      type="button"
                      className="bg-[#2B6CB0] hover:bg-[#2C5282]"
                    >
                      Ver cita
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
