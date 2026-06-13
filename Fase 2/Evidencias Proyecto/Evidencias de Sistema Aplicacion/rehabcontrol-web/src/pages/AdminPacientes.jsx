import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, FileText, Pencil, Activity } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { generarPdfFicha } from "../services/generarPdfFicha";
import { formatRut, unformatRut, validateRut } from "../lib/rut";

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
  const [editando, setEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previsiones, setPrevisiones] = useState([]);
  const [errores, setErrores] = useState({});
  const [camposVerificando, setCamposVerificando] = useState({});
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    telefono: "",
    prevision_id: "",
    fecha_nacimiento: "",
    email: "",
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: prevData } = await supabase
      .from("previsiones")
      .select("id, nombre")
      .order("nombre", { ascending: true });
    setPrevisiones(prevData || []);
    fetchPacientes();
  }

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

  async function verificarUnico(tabla, campo, valor, excluirId) {
    setCamposVerificando((prev) => ({ ...prev, [campo]: true }));
    let query = supabase.from(tabla).select("id").eq(campo, valor);
    if (excluirId) query = query.neq("id", excluirId);
    const { data } = await query.maybeSingle();
    setCamposVerificando((prev) => ({ ...prev, [campo]: false }));
    return !!data;
  }

  function handleRutChange(value) {
    const formatted = formatRut(value);
    setFormData((prev) => ({ ...prev, rut: formatted }));
    if (errores.rut) {
      setErrores((prev) => {
        const next = { ...prev };
        delete next.rut;
        return next;
      });
    }
  }

  async function validarRut(rut) {
    const clean = unformatRut(rut);
    if (!clean) {
      setErrores((prev) => ({ ...prev, rut: "" }));
      return;
    }
    const validation = validateRut(rut);
    if (!validation.valid) {
      setErrores((prev) => ({ ...prev, rut: validation.message }));
      return;
    }
    const existe = await verificarUnico("pacientes", "rut", clean, editando?.id);
    if (existe) {
      setErrores((prev) => ({ ...prev, rut: "Este RUT ya está registrado." }));
      return;
    }
    setErrores((prev) => ({ ...prev, rut: "" }));
  }

  function handleTelefonoChange(value) {
    const digits = value.replace(/\D/g, "").replace(/^56/, "");
    const limited = digits.slice(0, 8);
    setFormData((prev) => ({ ...prev, telefono: limited }));
    if (errores.telefono) {
      setErrores((prev) => {
        const next = { ...prev };
        delete next.telefono;
        return next;
      });
    }
  }

  async function validarTelefono(raw) {
    const completo = `+569${raw}`;
    if (!raw) {
      setErrores((prev) => ({ ...prev, telefono: "" }));
      return;
    }
    if (raw.length < 8) {
      setErrores((prev) => ({ ...prev, telefono: "El teléfono debe tener 8 dígitos." }));
      return;
    }
    const existe = await verificarUnico("pacientes", "telefono", completo, editando?.id);
    if (existe) {
      setErrores((prev) => ({ ...prev, telefono: "Este teléfono ya está registrado." }));
      return;
    }
    setErrores((prev) => ({ ...prev, telefono: "" }));
  }

  function hayErrores() {
    return Object.values(errores).some((v) => v !== "");
  }

  function abrirEdicion(paciente) {
    setEditando(paciente);
    setFormData({
      nombre: paciente.nombre || "",
      apellido: paciente.apellido || "",
      rut: paciente.rut || "",
      telefono: (paciente.telefono || "").replace("+569", ""),
      prevision_id: paciente.prevision_id || "",
      fecha_nacimiento: paciente.fecha_nacimiento || "",
      email: paciente.email || "",
    });
    setErrores({});
    setErrorMessage("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const rutClean = unformatRut(formData.rut) || null;
      const telefonoCompleto = formData.telefono ? `+569${formData.telefono}` : null;

      const payload = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        rut: rutClean,
        telefono: telefonoCompleto,
        prevision_id: formData.prevision_id || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
      };

      if (payload.fecha_nacimiento && payload.fecha_nacimiento > format(new Date(), "yyyy-MM-dd")) {
        setErrorMessage("La fecha de nacimiento no puede ser futura.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("pacientes")
        .update(payload)
        .eq("id", editando.id);

      if (error) throw error;

      setShowModal(false);
      setEditando(null);
      setFormData({
        nombre: "",
        apellido: "",
        rut: "",
        telefono: "",
        prevision_id: "",
        fecha_nacimiento: "",
        email: "",
      });
      setErrores({});
      fetchPacientes();
    } catch (error) {
      console.error("Error editando paciente:", error);
      setErrorMessage(error.message || "No se pudo guardar el paciente.");
    } finally {
      setSaving(false);
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
                <th className="px-6 py-4 font-medium">Estado</th>
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
                  className={`transition-colors hover:bg-slate-50/80 ${
                    paciente.activo === false ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-11 items-center justify-center rounded-full font-semibold text-white shadow-sm ${
                        paciente.activo !== false
                          ? "bg-linear-to-br from-cyan-500 to-blue-600"
                          : "bg-slate-400"
                      }`}>
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
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        paciente.activo !== false
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {paciente.activo !== false ? "Activo" : "Inactivo"}
                    </span>
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
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={async () => {
                          const confirmar = confirm(
                            `¿${paciente.activo !== false ? "Desactivar" : "Reactivar"} a ${paciente.nombreCompleto}?${
                              paciente.activo !== false ? " El paciente no podrá acceder a la app móvil." : ""
                            }`,
                          );
                          if (!confirmar) return;
                          await supabase
                            .from("pacientes")
                            .update({ activo: paciente.activo === false })
                            .eq("id", paciente.id);
                          fetchPacientes();
                        }}
                        className={`${
                          paciente.activo !== false
                            ? "text-slate-400 hover:text-rose-500"
                            : "text-slate-400 hover:text-emerald-500"
                        }`}
                        title={paciente.activo !== false ? "Desactivar paciente" : "Reactivar paciente"}
                      >
                        <Activity className={`size-4 ${paciente.activo !== false ? "" : "opacity-50"}`} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => abrirEdicion(paciente)}
                        className="text-slate-500 hover:text-[#2B6CB0]"
                      >
                        <Pencil className="size-4" />
                      </Button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditando(null);
          setErrorMessage("");
        }}
        title="Editar paciente"
      >
        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre *</label>
              <Input
                placeholder="Ej: Juan"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Apellido *</label>
              <Input
                placeholder="Ej: Pérez"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">RUT *</label>
            <div className="relative">
              <Input
                placeholder="Ej: 12.345.678-9"
                value={formData.rut}
                onChange={(e) => handleRutChange(e.target.value)}
                onBlur={() => validarRut(formData.rut)}
                className={errores.rut ? "border-rose-400 focus:border-rose-400" : ""}
                required
              />
              {camposVerificando.rut && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="size-4 animate-spin rounded-full border-2 border-[#2B6CB0] border-t-transparent" />
                </div>
              )}
            </div>
            {errores.rut && <p className="text-xs text-rose-500">{errores.rut}</p>}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Teléfono</label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">
                +569
              </div>
              <Input
                placeholder="XXXXXXXX"
                value={formData.telefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                onBlur={() => validarTelefono(formData.telefono)}
                className={`pl-12 ${errores.telefono ? "border-rose-400 focus:border-rose-400" : ""}`}
                maxLength={8}
              />
              {camposVerificando.telefono && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="size-4 animate-spin rounded-full border-2 border-[#2B6CB0] border-t-transparent" />
                </div>
              )}
            </div>
            {errores.telefono && <p className="text-xs text-rose-500">{errores.telefono}</p>}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email *</label>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Previsión</label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#2B6CB0]"
              value={formData.prevision_id}
              onChange={(e) => setFormData({ ...formData, prevision_id: e.target.value })}
            >
              <option value="">Sin previsión</option>
              {previsiones.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Fecha de nacimiento</label>
            <Input
              type="date"
              max={format(new Date(), "yyyy-MM-dd")}
              value={formData.fecha_nacimiento}
              onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditando(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#2B6CB0] hover:bg-[#2C5282]"
              disabled={saving || hayErrores()}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
