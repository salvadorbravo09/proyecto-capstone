import { useState, useEffect } from "react";
import { formatRut, unformatRut, validateRut } from "../lib/rut";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Search, Plus, UserCog, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminKinesiologos() {
  const [loading, setLoading] = useState(true);
  const [kinesiologos, setKinesiologos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errores, setErrores] = useState({});
  const [camposVerificando, setCamposVerificando] = useState({});
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    especialidad_id: "",
    registro_minsal: "",
    telefono: "",
    rut: "",
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: espData } = await supabase
      .from("especialidades")
      .select("id, nombre")
      .order("nombre", { ascending: true });
    setEspecialidades(espData || []);
    fetchKinesiologos();
  }

  async function fetchKinesiologos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kinesiologos")
        .select(
          "id, usuario_id, nombre, apellido, especialidad_id, especialidades(nombre), registro_minsal, telefono, rut, usuarios:usuarios(email)",
        )
        .order("nombre");

      if (error) throw error;
      setKinesiologos(data || []);
    } catch (error) {
      console.error("Error fetching kinesiologos:", error);
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

    const existe = await verificarUnico("kinesiologos", "rut", clean);
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

    const existe = await verificarUnico("kinesiologos", "telefono", completo);
    if (existe) {
      setErrores((prev) => ({ ...prev, telefono: "Este teléfono ya está registrado." }));
      return;
    }

    setErrores((prev) => ({ ...prev, telefono: "" }));
  }

  async function validarRegistroMinsal(valor) {
    if (!valor) {
      setErrores((prev) => ({ ...prev, registro_minsal: "" }));
      return;
    }

    const existe = await verificarUnico("kinesiologos", "registro_minsal", valor);
    if (existe) {
      setErrores((prev) => ({ ...prev, registro_minsal: "Este registro MINSAL ya está en uso." }));
      return;
    }

    setErrores((prev) => ({ ...prev, registro_minsal: "" }));
  }

  function hayErrores() {
    return Object.values(errores).some((v) => v !== "");
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
        password: formData.password.trim(),
        especialidad_id: formData.especialidad_id || null,
        registro_minsal: formData.registro_minsal.trim(),
        telefono: telefonoCompleto,
        rut: rutClean,
      };

      const { error } = await supabase.functions.invoke(
        "create-kinesiologo",
        {
          body: payload,
        },
      );

      if (error) throw error;

      fetchKinesiologos();
      setShowModal(false);
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        especialidad_id: "",
        registro_minsal: "",
        telefono: "",
        rut: "",
      });
      setErrores({});
    } catch (error) {
      console.error("Error creando kinesiólogo:", error);
      setErrorMessage(error.message || "No se pudo crear el kinesiólogo.");
    } finally {
      setSaving(false);
    }
  }

  const filteredKinesiologos = kinesiologos.filter(
    (k) =>
      (`${k.nombre || ''} ${k.apellido || ''}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.usuarios?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.rut?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="font-semibold text-3xl mb-1">Kinesiólogos</h1>
          <p className="text-muted-foreground">Gestión de kinesiólogos</p>
        </div>
        <Button
          className="bg-[#2B6CB0] hover:bg-[#2C5282]"
          onClick={() => {
            setErrorMessage("");
            setShowModal(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo kinesiólogo
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
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
              <th className="text-left p-4 font-medium">Kinesiólogo</th>
              <th className="text-left p-4 font-medium">Especialidad</th>
              <th className="text-left p-4 font-medium">Registro MINSAL</th>
              <th className="text-left p-4 font-medium">RUT</th>
              <th className="text-left p-4 font-medium">Teléfono</th>
              <th className="text-left p-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredKinesiologos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <UserCog className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No se encontraron kinesiólogos</p>
                </td>
              </tr>
            ) : (
              filteredKinesiologos.map((k) => (
                <tr
                  key={k.id}
                  className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-[#38A169] text-white flex items-center justify-center font-semibold">
                        {k.nombre?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{k.nombre} {k.apellido}</p>
                        <p className="text-sm text-muted-foreground">{k.usuarios?.email || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{k.especialidades?.nombre || k.especialidad || '-'}</td>
                  <td className="p-4">{k.registro_minsal || '-'}</td>
                  <td className="p-4">{k.rut || '-'}</td>
                  <td className="p-4">{k.telefono || '-'}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        k.usuario_id
                          ? "bg-[#38A169] text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {k.usuario_id ? "Activo" : "Pendiente"}
                    </span>
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
        }}
        title="Nuevo kinesiólogo"
      >
        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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
            <label className="text-sm font-medium">Contraseña inicial *</label>
            <Input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              minLength={8}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Especialidad *</label>
            <select
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#2B6CB0]"
              value={formData.especialidad_id}
              onChange={(e) =>
                setFormData({ ...formData, especialidad_id: e.target.value })
              }
              required
            >
              <option value="">Selecciona una especialidad</option>
              {especialidades.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Registro MINSAL *</label>
            <div className="relative">
              <Input
                placeholder="Ej: REG-12345"
                value={formData.registro_minsal}
                onChange={(e) => {
                  setFormData({ ...formData, registro_minsal: e.target.value });
                  if (errores.registro_minsal) {
                    setErrores((prev) => {
                      const next = { ...prev };
                      delete next.registro_minsal;
                      return next;
                    });
                  }
                }}
                onBlur={() => validarRegistroMinsal(formData.registro_minsal.trim())}
                className={errores.registro_minsal ? "border-rose-400 focus:border-rose-400" : ""}
                required
              />
              {camposVerificando.registro_minsal && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="size-4 animate-spin rounded-full border-2 border-[#2B6CB0] border-t-transparent" />
                </div>
              )}
            </div>
            {errores.registro_minsal && (
              <p className="text-xs text-rose-500">{errores.registro_minsal}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-sm font-medium">Teléfono *</label>
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
                  required
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
              {saving ? "Creando..." : "Crear kinesiólogo"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}