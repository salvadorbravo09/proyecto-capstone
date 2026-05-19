import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const pacientesMock = [
  {
    id: 1,
    nombre: "Camila Torres",
    rut: "18.234.567-8",
    kinesiologo: "Valentina Rojas",
    fechaRegistro: "18 may 2026",
  },
  {
    id: 2,
    nombre: "Javier Muñoz",
    rut: "15.678.901-2",
    kinesiologo: "Diego Pérez",
    fechaRegistro: "12 may 2026",
  },
  {
    id: 3,
    nombre: "Andrea Soto",
    rut: "17.456.789-0",
    kinesiologo: "Fernanda López",
    fechaRegistro: "Hoy",
  },
  {
    id: 4,
    nombre: "Rodrigo Salazar",
    rut: "14.908.776-5",
    kinesiologo: "Camila Vega",
    fechaRegistro: "02 may 2026",
  },
  {
    id: 5,
    nombre: "Valeria Díaz",
    rut: "19.001.223-4",
    kinesiologo: "Martín Herrera",
    fechaRegistro: "16 may 2026",
  },
];

export default function AdminPacientes() {
  const [searchTerm, setSearchTerm] = useState("");

  const pacientesFiltrados = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return pacientesMock;
    }

    return pacientesMock.filter((paciente) => {
      return [paciente.nombre, paciente.rut, paciente.kinesiologo]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [searchTerm]);

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
                        {paciente.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {paciente.nombre}
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
                      className="bg-[#2B6CB0] hover:bg-[#2C5282]"
                    >
                      Ver ficha clínica
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
