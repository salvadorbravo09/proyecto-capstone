import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Search, Plus, User, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export default function Pacientes() {
  const [loading, setLoading] = useState(true);
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    telefono: "",
    prevision: "",
    fecha_nacimiento: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [pacientesRes, citasRes] = await Promise.all([
        supabase.from("pacientes").select("*").order("nombre"),
        supabase
          .from("citas")
          .select(
            `
          id,
          fecha,
          hora,
          paciente_id,
          kinesiologo:kinesiologos(nombre, apellido)
        `,
          )
          .order("fecha", { ascending: false }),
      ]);

      setPacientes(pacientesRes.data || []);
      setCitas(citasRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("pacientes")
      .insert([formData]);

    if (error) {
      console.error("Error guardando paciente:", error);
      alert("Error al guardar paciente: " + error.message);
    } else {
      fetchData();
      setShowModal(false);
      setFormData({
        nombre: "",
        apellido: "",
        rut: "",
        telefono: "",
        prevision: "",
        fecha_nacimiento: "",
      });
    }
    setSaving(false);
  }

  function getPacienteData(pacienteId) {
    const pacienteCitas = citas.filter((c) => c.paciente_id === pacienteId);
    const cantidadCitas = pacienteCitas.length;
    const ultimaCita = pacienteCitas[0]?.fecha || null;
    const kinesiologoNombre =
      `${pacienteCitas[0]?.kinesiologo?.nombre || ""} ${
        pacienteCitas[0]?.kinesiologo?.apellido || ""
      }`.trim() || null;

    const fechaLimite = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const estado =
      ultimaCita && ultimaCita >= fechaLimite ? "activo" : "inactivo";

    return { cantidadCitas, ultimaCita, kinesiologo: kinesiologoNombre, estado };
  }

  const processedPacientes = pacientes.map((paciente) => ({
    ...paciente,
    ...getPacienteData(paciente.id),
  }));

  const filteredPacientes = processedPacientes.filter(
    (p) =>
      (`${p.nombre || ''} ${p.apellido || ''}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rut?.includes(searchTerm),
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-semibold text-3xl mb-1">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestión de pacientes y fichas clínicas
          </p>
        </div>
        <Button
          className="bg-[#2B6CB0] hover:bg-[#2C5282]"
          onClick={() => setShowModal(true)}
        >
          <Plus className="size-4" />
          Nuevo paciente
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o RUT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-accent border-b border-border">
            <tr>
              <th className="text-left p-4 font-medium">Paciente</th>
              <th className="text-left p-4 font-medium">RUT</th>
              <th className="text-left p-4 font-medium">Kinesiólogo</th>
              <th className="text-left p-4 font-medium">N° Sesiones</th>
              <th className="text-left p-4 font-medium">Última visita</th>
              <th className="text-left p-4 font-medium">Estado</th>
              <th className="text-left p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPacientes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <User className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No se encontraron pacientes
                  </p>
                </td>
              </tr>
            ) : (
              filteredPacientes.map((paciente) => (
                <tr
                  key={paciente.id}
                  className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-[#2B6CB0] text-white flex items-center justify-center font-semibold">
                        {paciente.nombre?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">
                          {paciente.nombre} {paciente.apellido}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paciente.prevision || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{paciente.rut || "-"}</td>
                  <td className="p-4">{paciente.kinesiologo || "-"}</td>
                  <td className="p-4">{paciente.cantidadCitas}</td>
                  <td className="p-4">
                    {paciente.ultima_visita
                      ? format(
                          new Date(paciente.ultima_visita),
                          "d 'de' MMM, yyyy",
                          {
                            locale: es,
                          },
                        )
                      : "-"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        paciente.estado === "activo"
                          ? "bg-[#38A169] text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {paciente.estado}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link to={`/pacientes/${paciente.id}`}>
                      <Button variant="outline" size="sm">
                        Ver ficha
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo paciente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Ej: Juan"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Apellido *</label>
              <Input
                placeholder="Ej: Pérez"
                value={formData.apellido}
                onChange={(e) =>
                  setFormData({ ...formData, apellido: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">RUT *</label>
            <Input
              placeholder="Ej: 12345678-9"
              value={formData.rut}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Teléfono</label>
            <Input
              placeholder="Ej: +56912345678"
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Previsión</label>
            <Input
              placeholder="Ej: FONASA, Isapre"
              value={formData.prevision}
              onChange={(e) =>
                setFormData({ ...formData, prevision: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Fecha de nacimiento</label>
            <Input
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) =>
                setFormData({ ...formData, fecha_nacimiento: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#2B6CB0] hover:bg-[#2C5282]"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
