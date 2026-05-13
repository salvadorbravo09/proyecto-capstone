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
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    especialidad: "",
    registro_minsal: "",
  });

  useEffect(() => {
    fetchKinesiologos();
  }, []);

  async function fetchKinesiologos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("kinesiologos")
        .select("*")
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

    try {
      // 1. Crear usuario en auth (invitar)
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        formData.email,
        { data: { rol: "kinesiologo" } }
      );

      if (inviteError) throw inviteError;

      const usuarioId = inviteData.user.id;

      // 2. Crear registro en kinesiologos
      const { error: kinError } = await supabase
        .from("kinesiologos")
        .insert([{
          usuario_id: usuarioId,
          nombre: formData.nombre,
          apellido: formData.apellido,
          especialidad: formData.especialidad,
          registro_minsal: formData.registro_minsal,
        }]);

      if (kinError) throw kinError;

      fetchKinesiologos();
      setShowModal(false);
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        especialidad: "",
        registro_minsal: "",
      });
    } catch (error) {
      console.error("Error creando kinesiólogo:", error);
      alert("Error al crear kinesiólogo: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredKinesiologos = kinesiologos.filter(
    (k) =>
      (`${k.nombre || ''} ${k.apellido || ''}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
          onClick={() => setShowModal(true)}
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
              <th className="text-left p-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredKinesiologos.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
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
                        <p className="text-sm text-muted-foreground">{k.email || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{k.especialidad || '-'}</td>
                  <td className="p-4">{k.registro_minsal || '-'}</td>
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
        onClose={() => setShowModal(false)}
        title="Nuevo kinesiólogo"
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
            <p className="text-xs text-muted-foreground">
              Se enviará una invitación para crear contraseña
            </p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Especialidad</label>
            <Input
              placeholder="Ej: Fisioterapia"
              value={formData.especialidad}
              onChange={(e) =>
                setFormData({ ...formData, especialidad: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Registro MINSAL</label>
            <Input
              placeholder="Ej: REG-12345"
              value={formData.registro_minsal}
              onChange={(e) =>
                setFormData({ ...formData, registro_minsal: e.target.value })
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
              {saving ? "Creando..." : "Crear kinesiólogo"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}