import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Search, Plus, User, Loader2, Copy } from "lucide-react";
import { Link } from "react-router";
import { supabase } from "@/lib/supabase";
import { format, subDays } from "date-fns";
import { getUserRole } from "@/lib/auth";
import { formatRut, unformatRut, validateRut } from "../lib/rut";

export default function Pacientes() {
  const [loading, setLoading] = useState(true);
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [kinesiologoId, setKinesiologoId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const role = await getUserRole(user.id);
    setUserRole(role);

    if (role === "kinesiologo") {
      const { data: kinData } = await supabase
        .from("kinesiologos")
        .select("id")
        .eq("usuario_id", user.id)
        .single();
      if (kinData) setKinesiologoId(kinData.id);
    }

    const { data: prevData } = await supabase
      .from("previsiones")
      .select("id, nombre")
      .order("nombre", { ascending: true });
    setPrevisiones(prevData || []);

    fetchData();
  }

  async function fetchData() {
    setLoading(true);
    try {
      let pacientesQuery = supabase.from("pacientes").select("*");

      if (userRole === "kinesiologo" && kinesiologoId) {
        pacientesQuery = pacientesQuery.eq("kinesiologo_asignado_id", kinesiologoId);
      }

      const [pacientesRes, citasRes] = await Promise.all([
        pacientesQuery.order("nombre"),
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

  async function verificarUnico(tabla, campo, valor) {
    setCamposVerificando((prev) => ({ ...prev, [campo]: true }));
    const { data } = await supabase
      .from(tabla)
      .select("id")
      .eq(campo, valor)
      .maybeSingle();
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

    const existe = await verificarUnico("pacientes", "rut", clean);
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

    const existe = await verificarUnico("pacientes", "telefono", completo);
    if (existe) {
      setErrores((prev) => ({ ...prev, telefono: "Este teléfono ya está registrado." }));
      return;
    }

    setErrores((prev) => ({ ...prev, telefono: "" }));
  }

  function hayErrores() {
    return Object.values(errores).some((v) => v !== "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setCreatedCredentials(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        setErrorMessage("No hay sesión activa.");
        setSaving(false);
        return;
      }

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

      const { data, error } = await supabase.functions.invoke(
        "create-paciente",
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (error) throw error;

      setCreatedCredentials({
        email: data.email,
        nombre: data.nombre,
      });
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
      fetchData();
    } catch (error) {
      console.error("Error creando paciente:", error);
      setErrorMessage(error.message || "No se pudo crear el paciente.");
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
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

  const previsionMap = useMemo(() => {
    const map = new Map();
    previsiones.forEach((p) => map.set(p.id, p.nombre));
    return map;
  }, [previsiones]);

  const processedPacientes = pacientes.map((paciente) => ({
    ...paciente,
    ...getPacienteData(paciente.id),
    previsionNombre: previsionMap.get(paciente.prevision_id) || paciente.prevision || "-",
  }));

  const filteredPacientes = processedPacientes.filter(
    (p) =>
      (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.apellido || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            {userRole === "admin"
              ? "Gestión global de pacientes"
              : "Gestión de mis pacientes"}
          </p>
        </div>
        <Button
          className="bg-[#2B6CB0] hover:bg-[#2C5282]"
          onClick={() => {
            setErrorMessage("");
            setCreatedCredentials(null);
            setShowModal(true);
          }}
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
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Estado</th>
              <th className="text-left p-4 font-medium">N° Sesiones</th>
              <th className="text-left p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPacientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
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
                        {`${paciente.nombre || '?'} ${paciente.apellido || ''}`.trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {`${paciente.nombre || ''} ${paciente.apellido || ''}`.trim() || "Sin nombre"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paciente.previsionNombre}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{paciente.rut || "-"}</td>
                  <td className="p-4">{paciente.email || "-"}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        paciente.usuario_id
                          ? "bg-[#38A169] text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {paciente.usuario_id ? "Registrado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="p-4">{paciente.cantidadCitas}</td>
                  <td className="p-4">
                    <Link to={`/pacientes/${paciente.id}/ficha`}>
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
        onClose={() => {
          setShowModal(false);
          setErrorMessage("");
          setCreatedCredentials(null);
        }}
        title="Nuevo paciente"
      >
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#38A169] bg-green-50 p-4">
              <p className="font-medium text-[#38A169] mb-2">
                Paciente creado exitosamente
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                El paciente ahora puede ingresar a la aplicación móvil usando su correo electrónico para recibir un código de acceso:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border">
                  <div>
                    <p className="text-xs text-muted-foreground">Email de acceso</p>
                    <p className="text-sm font-mono">{createdCredentials.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdCredentials.email)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-[#2B6CB0] hover:bg-[#2C5282]"
              onClick={() => {
                setShowModal(false);
                setCreatedCredentials(null);
              }}
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            {errorMessage ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                {errores.rut && (
                  <p className="text-xs text-rose-500">{errores.rut}</p>
                )}
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
                {errores.telefono && (
                  <p className="text-xs text-rose-500">{errores.telefono}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Previsión</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#2B6CB0]"
                  value={formData.prevision_id}
                  onChange={(e) =>
                    setFormData({ ...formData, prevision_id: e.target.value })
                  }
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
                  disabled={saving || hayErrores()}
                >
                  {saving ? "Creando..." : "Crear paciente"}
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
