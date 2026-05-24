import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Search,
  Clock3,
  CircleCheckBig,
  CalendarX2,
  Loader2,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { supabase } from "../lib/supabase";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const resumenConfig = [
  {
    id: "total",
    label: "Citas totales",
    icon: CalendarDays,
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    id: "asistida",
    label: "Asistidas",
    icon: CircleCheckBig,
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: "agendada",
    label: "Agendadas",
    icon: Clock3,
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    id: "cancelada",
    label: "Canceladas",
    icon: CalendarX2,
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

const filtros = ["Todas", "agendada", "asistida", "cancelada"];
const labelsFiltros = {
  Todas: "Todas",
  agendada: "Agendadas",
  asistida: "Asistidas",
  cancelada: "Canceladas",
};

function formatFullName(persona) {
  if (!persona) {
    return "";
  }

  if (persona.nombre_completo) {
    return persona.nombre_completo;
  }

  return [persona.nombre, persona.apellido].filter(Boolean).join(" ").trim();
}

export default function AdminCitas() {
  const [citas, setCitas] = useState([]);
  const [catalogoEstados, setCatalogoEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Obtener catálogo de estados posibles para citas
      const { data: estadosData, error: estadosError } = await supabase
        .from("estados")
        .select("id, nombre")
        .eq("entidad", "citas");

      if (estadosError) throw estadosError;
      if (estadosData) setCatalogoEstados(estadosData);

      // 2. Obtener las citas
      const { data, error } = await supabase
        .from("citas")
        .select(
          `
          id,
          fecha,
          hora,
          motivo_consulta,
          estados (id, nombre),
          pacientes (rut, nombre, apellido),
          kinesiologos (nombre, apellido)
        `,
        )
        .order("fecha", { ascending: false })
        .order("hora", { ascending: true });

      if (error) throw error;

      if (data) {
        setCitas(data);
      }
    } catch (error) {
      console.error("Error al cargar citas o estados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial de datos combinada
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInitialData();
  }, [fetchInitialData]);

  const handleStatusChange = async (citaId, newStatusName) => {
    try {
      setUpdating(citaId);

      const targetState = catalogoEstados.find(
        (e) => e.nombre === newStatusName,
      );
      if (!targetState) {
        throw new Error("Estado no encontrado en el catálogo");
      }

      // 1. Actualizar estado de la cita
      const { error: updateError } = await supabase
        .from("citas")
        .update({ estado_id: targetState.id })
        .eq("id", citaId);

      if (updateError) throw updateError;

      // 2. Registrar en historial de cambios
      const { error: historyError } = await supabase
        .from("estado_historial")
        .insert({
          entidad_tipo: "citas",
          entidad_id: citaId,
          estado_id: targetState.id,
          comentario: "Estado actualizado desde panel de administración",
        });

      if (historyError) {
        console.warn("No se pudo insertar en historial:", historyError);
      }

      // Actualizamos el estado local
      setCitas((prev) =>
        prev.map((cita) =>
          cita.id === citaId
            ? { ...cita, estados: { ...cita.estados, nombre: newStatusName } }
            : cita,
        ),
      );
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Hubo un error modificando el estado.");
    } finally {
      setUpdating(null);
    }
  };

  const citasFiltradas = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return citas.filter((cita) => {
      const pacienteNombre = formatFullName(cita.pacientes);
      const pacienteRut = cita.pacientes?.rut || "";
      const kineNombre = formatFullName(cita.kinesiologos);
      const fechaFormat = cita.fecha
        ? format(parseISO(cita.fecha), "dd MMM yyyy", { locale: es })
        : "";

      const matchesSearch =
        !query ||
        [
          pacienteNombre,
          pacienteRut,
          kineNombre,
          fechaFormat,
          cita.hora,
          cita.motivo_consulta || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        activeFilter === "Todas" || cita.estados?.nombre === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [citas, searchTerm, activeFilter]);

  const resumenCounts = useMemo(() => {
    return {
      total: citas.length,
      asistida: citas.filter((c) => c.estados?.nombre === "asistida").length,
      agendada: citas.filter((c) => c.estados?.nombre === "agendada").length,
      cancelada: citas.filter((c) => c.estados?.nombre === "cancelada").length,
    };
  }, [citas]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
          Citas Admin
        </h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Vista de control para revisar citas registradas, filtrar su estado y
          administrarlas.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resumenConfig.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-xl p-2 ${item.bg}`}>
                  <Icon className={`size-4 ${item.accent}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                {resumenCounts[item.id]}
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
                    ? "bg-[#2B6CB0] hover:bg-[#2C5282] capitalize"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 capitalize"
                }
                onClick={() => setActiveFilter(filtro)}
              >
                {labelsFiltros[filtro]}
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
                Citas registradas en el sistema procedentes de Supabase.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {citasFiltradas.length} resultados
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-3 font-medium">Cargando citas...</span>
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <CalendarX2 className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-lg font-medium text-slate-900">
                No se encontraron citas
              </p>
              <p className="text-sm">
                No existen registros que coincidan con la búsqueda actual.
              </p>
            </div>
          ) : (
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
                {citasFiltradas.map((cita) => {
                  const pacienteNombre =
                    formatFullName(cita.pacientes) || "Sin Nombre";
                  const kineNombre = formatFullName(cita.kinesiologos);
                  const nombreEstado = cita.estados?.nombre;
                  const estadoClases =
                    nombreEstado === "asistida"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                      : nombreEstado === "agendada"
                        ? "bg-amber-500/10 text-amber-600 border-amber-200"
                        : "bg-rose-500/10 text-rose-600 border-rose-200";

                  return (
                    <tr
                      key={cita.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-sm shrink-0">
                            {pacienteNombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {pacienteNombre}
                            </p>
                            <p className="text-sm text-slate-500">
                              Cita programada
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {cita.pacientes?.rut || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {kineNombre || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 capitalize whitespace-nowrap">
                        {cita.fecha
                          ? format(parseISO(cita.fecha), "dd MMM yyyy", {
                              locale: es,
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                        {cita.hora ? cita.hora.substring(0, 5) : "-"}
                      </td>
                      <td className="min-w-50 px-6 py-4 text-sm text-slate-700">
                        {cita.motivo_consulta || "Sin motivo registrado"}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={nombreEstado || "agendada"}
                          disabled={updating === cita.id}
                          onChange={(e) =>
                            handleStatusChange(cita.id, e.target.value)
                          }
                          className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize outline-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 transition-all ${estadoClases}`}
                        >
                          <option value="agendada">Agendada</option>
                          <option value="asistida">Asistida</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
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
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
