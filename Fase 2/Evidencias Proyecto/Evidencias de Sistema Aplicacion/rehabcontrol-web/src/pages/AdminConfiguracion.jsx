import { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Shield,
  Stethoscope,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function CatalogoSection({ tabla, titulo, nombreSingular, icono, campos, orden, payloadExtra }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const initialFormData = campos.reduce((acc, c) => ({ ...acc, [c.key]: "" }), {});
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from(tabla)
      .select("*")
      .order(orden, { ascending: true });
    if (error) console.error(`Error fetching ${tabla}:`, error);
    setItems(data || []);
    setLoading(false);
  }

  function abrirCrear() {
    setEditando(null);
    setFormData(initialFormData);
    setErrorMessage("");
    setShowModal(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setFormData(
      campos.reduce((acc, c) => ({ ...acc, [c.key]: item[c.key] || "" }), {}),
    );
    setErrorMessage("");
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const payload = campos.reduce((acc, c) => {
        const val = formData[c.key]?.trim();
        acc[c.key] = val || null;
        return acc;
      }, { ...payloadExtra });

      if (editando) {
        const { error } = await supabase.from(tabla).update(payload).eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tabla).insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchItems();
    } catch (error) {
      console.error(`Error guardando ${tabla}:`, error);
      setErrorMessage(error.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEliminar(item) {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    const { error } = await supabase.from(tabla).delete().eq("id", item.id);
    if (error) {
      console.error(`Error eliminando de ${tabla}:`, error);
      setErrorMessage(error.message);
    } else {
      fetchItems();
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      campos.some((c) => (item[c.key] || "").toLowerCase().includes(q)),
    );
  }, [items, searchTerm, campos]);

  const Icon = icono;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon className="size-5 text-[#2B6CB0]" />
          <p className="text-sm text-muted-foreground">
            {items.length} registro{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="bg-[#2B6CB0] hover:bg-[#2C5282]"
          onClick={abrirCrear}
        >
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${titulo.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Icon className="size-12 mb-3 opacity-50" />
            <p className="text-sm font-medium text-slate-500">
              {searchTerm ? "Sin resultados" : `No hay ${titulo.toLowerCase()}`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm
                ? "Intenta con otro término de búsqueda."
                : `Agrega la primera ${nombreSingular.toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-accent border-b border-border">
              <tr>
                {campos.map((c) => (
                  <th key={c.key} className="text-left p-4 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="text-right p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
                >
                  {campos.map((c) => (
                    <td
                      key={c.key}
                      className={`p-4 ${c.key === "nombre" ? "font-medium" : "text-sm text-muted-foreground"}`}
                    >
                      {c.render ? c.render(item) : item[c.key] || "-"}
                    </td>
                  ))}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEditar(item)}
                        className="text-slate-500 hover:text-[#2B6CB0]"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(item)}
                        className="text-slate-500 hover:text-rose-500"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editando ? `Editar ${nombreSingular.toLowerCase()}` : `Crear ${nombreSingular.toLowerCase()}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {campos.map((c) => (
            <div key={c.key} className="grid gap-2">
              <label className="text-sm font-medium">
                {c.label} {c.required ? <span className="text-rose-500">*</span> : null}
              </label>
              {c.type === "select" ? (
                <select
                  value={formData[c.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [c.key]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2B6CB0]"
                  required={c.required}
                >
                  <option value="">Seleccionar...</option>
                  {c.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : c.type === "textarea" ? (
                <textarea
                  placeholder={c.placeholder || ""}
                  value={formData[c.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [c.key]: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2B6CB0] resize-none"
                />
              ) : (
                <Input
                  placeholder={c.placeholder || ""}
                  value={formData[c.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [c.key]: e.target.value }))
                  }
                  required={c.required}
                />
              )}
            </div>
          ))}

          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#2B6CB0] hover:bg-[#2C5282]"
              disabled={saving}
            >
              {saving ? "Guardando..." : editando ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminConfiguracion() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-semibold text-3xl mb-1">Configuración</h1>
        <p className="text-muted-foreground">Administrar catálogos del sistema</p>
      </div>

      <Tabs defaultValue="previsiones">
        <TabsList className="mb-6">
          <TabsTrigger value="previsiones">Previsiones</TabsTrigger>
          <TabsTrigger value="especialidades">Especialidades</TabsTrigger>
          <TabsTrigger value="estados">Estados</TabsTrigger>
        </TabsList>

        <TabsContent value="previsiones">
          <CatalogoSection
            tabla="previsiones"
            titulo="Previsiones"
            nombreSingular="Previsión"
            icono={Shield}
            campos={[
              { key: "nombre", label: "Nombre", required: true, placeholder: "Ej: FONASA" },
              { key: "descripcion", label: "Descripción", type: "textarea", placeholder: "Descripción opcional" },
            ]}
            orden="nombre"
          />
        </TabsContent>

        <TabsContent value="especialidades">
          <CatalogoSection
            tabla="especialidades"
            titulo="Especialidades"
            nombreSingular="Especialidad"
            icono={Stethoscope}
            campos={[
              { key: "nombre", label: "Nombre", required: true, placeholder: "Ej: Fisioterapia" },
              { key: "descripcion", label: "Descripción", type: "textarea", placeholder: "Descripción opcional" },
            ]}
            orden="nombre"
          />
        </TabsContent>

        <TabsContent value="estados">
          <CatalogoSection
            tabla="estados"
            titulo="Estados"
            nombreSingular="Estado"
            icono={BadgeCheck}
            payloadExtra={{ entidad: "citas" }}
            campos={[
              { key: "nombre", label: "Nombre", required: true, placeholder: "Ej: pendiente" },
              { key: "descripcion", label: "Descripción", type: "textarea", placeholder: "Descripción opcional" },
            ]}
            orden="nombre"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
