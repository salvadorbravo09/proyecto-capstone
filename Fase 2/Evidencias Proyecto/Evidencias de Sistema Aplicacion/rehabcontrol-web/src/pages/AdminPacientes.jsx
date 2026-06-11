import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, FileText } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { supabase } from "@/lib/supabase";
import { generarPdfFicha } from "../services/generarPdfFicha";

function formatRegistrationDate(createdAt) {
  if (!createdAt) {
    return "-";
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return "Hoy";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFullName(paciente) {
  const nombre = [paciente.nombre, paciente.apellido]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (nombre) {
    return nombre;
  }

  if (paciente.nombre_completo) {
    return paciente.nombre_completo;
  }

  return "Sin nombre";
}

function formatKinesiologo(kinesiologo) {
  if (!kinesiologo) {
    return "Sin asignar";
  }

  return (
    [kinesiologo.nombre, kinesiologo.apellido]
      .filter(Boolean)
      .join(" ")
      .trim() || "Sin asignar"
  );
}

export default function AdminPacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [exportandoId, setExportandoId] = useState(null);

  useEffect(() => {
    fetchPacientes();
  }, []);

  async function fetchPacientes() {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*, usuarios:usuarios(created_at)")
        .order("rut", { ascending: true });

      if (error) {
        throw error;
      }

      const patients = data || [];
      const assignedKinesiologoIds = [
        ...new Set(
          patients
            .map((paciente) => paciente.kinesiologo_asignado_id)
            .filter(Boolean),
        ),
      ];

      let kinesiologosById = new Map();

      if (assignedKinesiologoIds.length > 0) {
        const { data: kinesiologosData, error: kinError } = await supabase
          .from("kinesiologos")
          .select("*")
          .in("id", assignedKinesiologoIds);

        if (kinError) {
          throw kinError;
        }

        kinesiologosById = new Map(
          (kinesiologosData || []).map((kinesiologo) => [
            kinesiologo.id,
            kinesiologo,
          ]),
        );
      }

      setPacientes(
        patients.map((paciente) => ({
          ...paciente,
          kinesiologo: formatKinesiologo(
            kinesiologosById.get(paciente.kinesiologo_asignado_id),
          ),
          fechaRegistro: formatRegistrationDate(
            paciente.usuarios?.created_at || null,
          ),
          nombreCompleto: formatFullName(paciente),
        })),
      );
    } catch (error) {
      console.error("Error fetching pacientes:", error);
      setErrorMessage(
        error?.message || "No se pudieron cargar los pacientes desde Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPdf(id) {
    setExportandoId(id);
    try {
      await generarPdfFicha(id);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Error al generar PDF: " + (err?.message || err));
    } finally {
      setExportandoId(null);
    }
  }

  const pacientesFiltrados = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return pacientes;
    }

    return pacientes.filter((paciente) => {
      return [paciente.nombreCompleto, paciente.rut, paciente.kinesiologo]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [pacientes, searchTerm]);

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8">
        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
            Pacientes Admin
          </h1>
          <p className="max-w-2xl text-sm text-slate-500">
            Lista total de pacientes registrados, con búsqueda por nombre, RUT o
            kinesiólogo y acceso directo a su ficha clínica.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, RUT o kinesiólogo..."
            className="border-slate-200 bg-slate-50 pl-10 text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Listado de pacientes
              </h2>
              <p className="text-sm text-slate-500">
                Pacientes registrados en el sistema con sus datos principales.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {pacientesFiltrados.length} resultados
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-275">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Paciente</th>
                <th className="px-6 py-4 font-medium">RUT</th>
                <th className="px-6 py-4 font-medium">Kinesiólogo</th>
                <th className="px-6 py-4 font-medium">Fecha registro</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pacientesFiltrados.map((paciente) => (
                <tr
                  key={paciente.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-600 font-semibold text-white shadow-sm">
                        {paciente.nombreCompleto.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {paciente.nombreCompleto}
                        </p>
                        <p className="text-sm text-slate-500">
                          Registro clínico
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {paciente.rut}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {paciente.kinesiologo}
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                      {paciente.fechaRegistro}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      type="button"
                      disabled={exportandoId === paciente.id}
                      onClick={() => handleExportPdf(paciente.id)}
                      className="bg-[#2B6CB0] hover:bg-[#2C5282] disabled:opacity-50"
                    >
                      {exportandoId === paciente.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                      {exportandoId === paciente.id ? "Generando..." : "Ver ficha clínica"}
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
