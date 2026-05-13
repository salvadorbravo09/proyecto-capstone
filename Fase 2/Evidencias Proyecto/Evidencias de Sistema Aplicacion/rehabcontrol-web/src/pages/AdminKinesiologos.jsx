import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Search, Plus, UserCog, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminKinesiologos() {
  const [loading, setLoading] = useState(true);
  const [kinesiologos, setKinesiologos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    especialidad: "",
    registro_minsal: "",
    telefono: "",
    rut: "",
  });

  useEffect(() => {
    fetchKinesiologos();
  }, []);

  async function fetchKinesiologos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kinesiologos")
        .select(
          "id, usuario_id, nombre, apellido, especialidad, registro_minsal, telefono, rut, usuarios:usuarios(email)",
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
        especialidad: formData.especialidad.trim(),
        registro_minsal: formData.registro_minsal.trim(),
        telefono: formData.telefono.trim(),
        rut: formData.rut.trim(),
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
        especialidad: "",
        registro_minsal: "",
        telefono: "",
        rut: "",
      });
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
                  <td className="p-4">{k.especialidad || '-'}</td>
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
            <Input
              placeholder="Ej: Fisioterapia"
              value={formData.especialidad}
              onChange={(e) =>
                setFormData({ ...formData, especialidad: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Registro MINSAL *</label>
            <Input
              placeholder="Ej: REG-12345"
              value={formData.registro_minsal}
              onChange={(e) =>
                setFormData({ ...formData, registro_minsal: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">RUT *</label>
              <Input
                placeholder="12.345.678-9"
                value={formData.rut}
                onChange={(e) =>
                  setFormData({ ...formData, rut: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Teléfono *</label>
              <Input
                placeholder="+56 9 1234 5678"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                required
              />
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
              disabled={saving}
            >
              {saving ? "Creando..." : "Crear kinesiólogo"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}