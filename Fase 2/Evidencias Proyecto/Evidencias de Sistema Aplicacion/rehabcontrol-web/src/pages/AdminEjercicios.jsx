import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Search, Plus, Dumbbell, Loader2, Pencil, Trash2, Video, Upload, X, Play, Film } from "lucide-react";
import { supabase } from "@/lib/supabase";

const BUCKET = "ejercicio-videos";

export default function AdminEjercicios() {
  const [loading, setLoading] = useState(true);
  const [ejercicios, setEjercicios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    parte_cuerpo: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchEjercicios();
  }, []);

  async function fetchEjercicios() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ejercicios")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error fetching ejercicios:", error);
    }
    setEjercicios(data || []);
    setLoading(false);
  }

  function abrirCrear() {
    setEditando(null);
    setFormData({ nombre: "", descripcion: "", parte_cuerpo: "" });
    setVideoFile(null);
    setVideoPreview(null);
    setErrorMessage("");
    setShowModal(true);
  }

  function abrirEditar(ej) {
    setEditando(ej);
    setFormData({
      nombre: ej.nombre,
      descripcion: ej.descripcion || "",
      parte_cuerpo: ej.parte_cuerpo || "",
    });
    setVideoFile(null);
    setVideoPreview(ej.url_multimedia || null);
    setErrorMessage("");
    setShowModal(true);
  }

  function handleVideoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setErrorMessage("Solo se permiten archivos de video.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("El video no debe superar los 50MB.");
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setErrorMessage("");
  }

  function quitarVideo() {
    setVideoFile(null);
    setVideoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function extractStoragePath(publicUrl) {
    const prefix = `${BUCKET}/`;
    const idx = publicUrl.indexOf(prefix);
    if (idx === -1) return null;
    return publicUrl.substring(idx + prefix.length);
  }

  async function uploadVideo(ejercicioId) {
    if (!videoFile) return null;

    const ext = videoFile.name.split(".").pop();
    const filePath = `${ejercicioId}/video.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, videoFile, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        parte_cuerpo: formData.parte_cuerpo.trim() || null,
      };

      let ejercicioId;

      if (editando) {
        ejercicioId = editando.id;
        const { error } = await supabase.from("ejercicios").update(payload).eq("id", ejercicioId);
        if (error) throw error;
      } else {
        const { data: newEj, error } = await supabase
          .from("ejercicios")
          .insert([payload])
          .select("id")
          .single();
        if (error) throw error;
        ejercicioId = newEj.id;
      }

      const hadVideo = editando?.url_multimedia;
      const hasNewVideo = videoFile !== null;
      const wantsRemove = !videoFile && !videoPreview;

      if (hasNewVideo) {
        if (hadVideo) {
          const oldPath = extractStoragePath(editando.url_multimedia);
          if (oldPath) {
            await supabase.storage.from(BUCKET).remove([oldPath]);
          }
        }
        const publicUrl = await uploadVideo(ejercicioId);
        await supabase.from("ejercicios").update({ url_multimedia: publicUrl }).eq("id", ejercicioId);
      } else if (editando && wantsRemove && hadVideo) {
        const oldPath = extractStoragePath(editando.url_multimedia);
        if (oldPath) {
          await supabase.storage.from(BUCKET).remove([oldPath]);
        }
        await supabase.from("ejercicios").update({ url_multimedia: null }).eq("id", ejercicioId);
      }

      setShowModal(false);
      fetchEjercicios();
    } catch (error) {
      console.error("Error guardando ejercicio:", error);
      setErrorMessage(error.message || "No se pudo guardar el ejercicio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEliminar(ej) {
    if (!confirm(`¿Eliminar "${ej.nombre}"?`)) return;

    if (ej.url_multimedia) {
      const path = extractStoragePath(ej.url_multimedia);
      if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
    }

    const { error } = await supabase.from("ejercicios").delete().eq("id", ej.id);
    if (error) {
      console.error("Error eliminando ejercicio:", error);
      setErrorMessage(error.message);
    } else {
      fetchEjercicios();
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return ejercicios;
    return ejercicios.filter(
      (ej) =>
        ej.nombre.toLowerCase().includes(q) ||
        (ej.descripcion || "").toLowerCase().includes(q) ||
        (ej.parte_cuerpo || "").toLowerCase().includes(q),
    );
  }, [ejercicios, searchTerm]);

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
          <h1 className="font-semibold text-3xl mb-1">Ejercicios</h1>
          <p className="text-muted-foreground">
            Catálogo de ejercicios ({ejercicios.length} totales)
          </p>
        </div>
        <Button
          className="bg-[#2B6CB0] hover:bg-[#2C5282]"
          onClick={abrirCrear}
        >
          <Plus className="size-4" />
          Nuevo ejercicio
        </Button>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción o parte del cuerpo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Dumbbell className="size-12 mb-3 opacity-50" />
            <p className="text-sm font-medium text-slate-500">
              {searchTerm ? "Sin resultados" : "No hay ejercicios"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm
                ? "Intenta con otro término de búsqueda."
                : "Crea el primer ejercicio presionando 'Nuevo ejercicio'."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-accent border-b border-border">
              <tr>
                <th className="text-left p-4 font-medium">Nombre</th>
                <th className="text-left p-4 font-medium">Descripción</th>
                <th className="text-left p-4 font-medium">Parte del cuerpo</th>
                <th className="text-center p-4 font-medium">Video</th>
                <th className="text-right p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ej) => (
                <tr
                  key={ej.id}
                  className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="p-4 font-medium">{ej.nombre}</td>
                  <td className="p-4 text-sm text-muted-foreground max-w-md truncate">
                    {ej.descripcion || "-"}
                  </td>
                  <td className="p-4">
                    {ej.parte_cuerpo ? (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {ej.parte_cuerpo}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {ej.url_multimedia ? (
                      <a
                        href={ej.url_multimedia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#2B6CB0] hover:text-[#2C5282] hover:underline"
                      >
                        <Film className="size-4" />
                        Ver
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEditar(ej)}
                        className="text-slate-500 hover:text-[#2B6CB0]"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(ej)}
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
        title={editando ? "Editar ejercicio" : "Nuevo ejercicio"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input
              placeholder="Ej: Elevación de pierna recta"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              placeholder="Describe cómo se realiza el ejercicio..."
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2B6CB0] resize-none"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Parte del cuerpo</label>
            <Input
              placeholder="Ej: Pierna, Rodilla, Glúteos..."
              value={formData.parte_cuerpo}
              onChange={(e) =>
                setFormData({ ...formData, parte_cuerpo: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Video demostrativo (MP4)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleVideoChange}
              className="hidden"
            />
            {videoPreview ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-48 bg-black"
                >
                  Tu navegador no soporta video.
                </video>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-200">
                  <span className="text-xs text-slate-500 truncate">
                    {videoFile ? videoFile.name : "Video actual"}
                  </span>
                  <button
                    type="button"
                    onClick={quitarVideo}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <X className="size-3" />
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500 hover:border-[#2B6CB0] hover:text-[#2B6CB0] transition-colors cursor-pointer"
              >
                <Upload className="size-8" />
                <span className="font-medium">Subir video</span>
                <span className="text-xs">MP4 hasta 50MB</span>
              </button>
            )}
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
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
              {saving
                ? "Guardando..."
                : editando
                  ? "Guardar cambios"
                  : "Crear ejercicio"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
