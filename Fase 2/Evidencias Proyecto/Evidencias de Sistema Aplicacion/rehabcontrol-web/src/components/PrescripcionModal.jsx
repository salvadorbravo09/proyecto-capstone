import { useState, useMemo } from "react";
import { Search, Plus, X, Dumbbell, Loader2, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function PrescripcionModal({ paciente, rutina, biblioteca, onSave, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState(
    rutina.ejercicios.map((ej) => ({
      ...ej,
      _key: crypto.randomUUID(),
    })),
  );
  const [saving, setSaving] = useState(false);

  const ejerciciosFiltrados = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return biblioteca;
    return biblioteca.filter(
      (ej) =>
        ej.nombre.toLowerCase().includes(query) ||
        ej.descripcion.toLowerCase().includes(query) ||
        ej.parte_cuerpo.toLowerCase().includes(query),
    );
  }, [biblioteca, searchTerm]);

  const idsSeleccionados = useMemo(
    () => new Set(ejerciciosSeleccionados.map((ej) => ej.id)),
    [ejerciciosSeleccionados],
  );

  function agregarEjercicio(ej) {
    setEjerciciosSeleccionados((prev) => [
      ...prev,
      {
        id: ej.id,
        _key: crypto.randomUUID(),
        nombre: ej.nombre,
        descripcion: ej.descripcion,
        parte_cuerpo: ej.parte_cuerpo,
        series: 3,
        repeticiones: 10,
        frecuencia_diaria: 1,
      },
    ]);
  }

  function quitarEjercicio(key) {
    setEjerciciosSeleccionados((prev) => prev.filter((ej) => ej._key !== key));
  }

  function actualizarCampo(key, campo, valor) {
    setEjerciciosSeleccionados((prev) =>
      prev.map((ej) =>
        ej._key === key ? { ...ej, [campo]: valor } : ej,
      ),
    );
  }

  async function handleGuardar() {
    setSaving(true);
    try {
      await onSave({
        id: rutina.id,
        fecha_inicio: rutina.fecha_inicio,
        ejercicios: ejerciciosSeleccionados.map((ej) => ({
          id: ej.id,
          nombre: ej.nombre,
          descripcion: ej.descripcion,
          parte_cuerpo: ej.parte_cuerpo,
          series: ej.series,
          repeticiones: ej.repeticiones,
          frecuencia_diaria: ej.frecuencia_diaria,
        })),
      });
    } catch (error) {
      console.error("Error saving routine:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-8 pb-8">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Prescripción de rutina
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {paciente.nombre} {paciente.apellido} · {paciente.rut}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left: Biblioteca de ejercicios */}
          <div className="border-r border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Biblioteca de ejercicios
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre, descripción o parte del cuerpo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 bg-slate-50 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {ejerciciosFiltrados.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No se encontraron ejercicios.
                </p>
              ) : (
                ejerciciosFiltrados.map((ej) => {
                  const yaAgregado = idsSeleccionados.has(ej.id);
                  return (
                    <div
                      key={ej.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        yaAgregado
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {ej.nombre}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {ej.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {ej.parte_cuerpo}
                            </span>
                            <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                              {ej.dificultad}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={yaAgregado}
                          onClick={() => agregarEjercicio(ej)}
                          className={`shrink-0 rounded-lg p-2 transition-colors ${
                            yaAgregado
                              ? "bg-emerald-100 text-emerald-500 cursor-not-allowed"
                              : "bg-[#2B6CB0] text-white hover:bg-[#2C5282]"
                          }`}
                        >
                          {yaAgregado ? (
                            <span className="text-xs font-semibold px-1">OK</span>
                          ) : (
                            <Plus className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Ejercicios seleccionados */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Ejercicios seleccionados
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {ejerciciosSeleccionados.length} ejercicios
              </span>
            </div>

            {ejerciciosSeleccionados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Dumbbell className="size-10 mb-2 opacity-50" />
                <p className="text-sm font-medium text-slate-500">
                  Ningún ejercicio seleccionado
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Busca y agrega ejercicios desde la biblioteca.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {ejerciciosSeleccionados.map((ej, index) => (
                  <div
                    key={ej._key}
                    className="rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-[#2B6CB0]">
                          {index + 1}
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {ej.nombre}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitarEjercicio(ej._key)}
                        className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                          Series
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={ej.series}
                          onChange={(e) =>
                            actualizarCampo(ej._key, "series", Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-[#2B6CB0]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                          Repeticiones
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={ej.repeticiones}
                          onChange={(e) =>
                            actualizarCampo(ej._key, "repeticiones", Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-[#2B6CB0]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-0.5">
                          Frec./día
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={ej.frecuencia_diaria}
                          onChange={(e) =>
                            actualizarCampo(ej._key, "frecuencia_diaria", Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-[#2B6CB0]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-slate-400">
            {ejerciciosSeleccionados.length} ejercicio(s) en la rutina
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleGuardar}
              disabled={saving || ejerciciosSeleccionados.length === 0}
              className="bg-[#2B6CB0] hover:bg-[#2C5282] gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Guardar y enviar al paciente
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
