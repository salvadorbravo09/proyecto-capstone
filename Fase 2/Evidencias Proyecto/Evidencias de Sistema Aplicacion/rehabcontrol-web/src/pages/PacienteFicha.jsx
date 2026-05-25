import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, CalendarDays, Activity, TrendingUp, Dumbbell, Edit3, Award, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import PrescripcionModal from "../components/PrescripcionModal";
import { mockPaciente, mockHistorial, mockRutinaActiva, mockBiblioteca, mockEvolucion } from "../data/mockPaciente";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const tabs = [
  { id: "datos", label: "Datos personales", icon: User },
  { id: "historial", label: "Historial de sesiones", icon: Calendar },
  { id: "rutina", label: "Rutina activa", icon: Dumbbell },
  { id: "evolucion", label: "Evolución", icon: TrendingUp },
];

export default function PacienteFicha() {
  const [activeTab, setActiveTab] = useState("datos");
  const [rutina, setRutina] = useState(mockRutinaActiva);
  const [showPrescripcion, setShowPrescripcion] = useState(false);

  const paciente = mockPaciente;
  const historial = mockHistorial;
  const biblioteca = mockBiblioteca;
  const evolucion = mockEvolucion;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/pacientes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver a pacientes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {paciente.nombre} {paciente.apellido}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {paciente.rut} · {paciente.prevision}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 border border-emerald-200">
              <Activity className="size-3.5" />
              Activo
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#2B6CB0] text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Tab: Datos personales */}
        {activeTab === "datos" && (
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Información del paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <User className="size-4" />
                  Nombre completo
                </div>
                <p className="font-medium text-slate-900">{paciente.nombre} {paciente.apellido}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Award className="size-4" />
                  RUT
                </div>
                <p className="font-medium text-slate-900">{paciente.rut}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Mail className="size-4" />
                  Email
                </div>
                <p className="font-medium text-slate-900">{paciente.email}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Phone className="size-4" />
                  Teléfono
                </div>
                <p className="font-medium text-slate-900">{paciente.telefono}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <CalendarDays className="size-4" />
                  Fecha de nacimiento
                </div>
                <p className="font-medium text-slate-900">
                  {format(parseISO(paciente.fecha_nacimiento), "dd MMMM yyyy", { locale: es })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  <Activity className="size-4" />
                  Previsión
                </div>
                <p className="font-medium text-slate-900">{paciente.prevision}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Historial de sesiones */}
        {activeTab === "historial" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Historial de sesiones</h2>
            <div className="space-y-4">
              {historial.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No hay sesiones registradas.</p>
              ) : (
                historial.map((sesion) => (
                  <div
                    key={sesion.id}
                    className="relative rounded-xl border border-slate-200 bg-white p-4 pl-8 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 before:-translate-x-1/2 before:last:hidden"
                  >
                    <div className="absolute left-4 top-4 size-3 -translate-x-1/2 rounded-full bg-[#2B6CB0] ring-4 ring-white" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-slate-900">{sesion.motivo}</p>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {format(parseISO(sesion.fecha), "dd MMM yyyy", { locale: es })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {sesion.hora}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {sesion.kinesiologo}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 border-t border-slate-100 pt-2">
                      {sesion.notas}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Rutina activa */}
        {activeTab === "rutina" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Rutina activa</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Desde el {format(parseISO(rutina.fecha_inicio), "dd MMM yyyy", { locale: es })}
                </p>
              </div>
              <Button
                className="bg-[#2B6CB0] hover:bg-[#2C5282] gap-2"
                onClick={() => setShowPrescripcion(true)}
              >
                <Edit3 className="size-4" />
                Editar rutina
              </Button>
            </div>

            {rutina.ejercicios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Dumbbell className="size-12 mb-3 opacity-50" />
                <p className="text-sm font-medium text-slate-500">Sin ejercicios asignados</p>
                <p className="text-xs text-slate-400 mt-1">Presiona "Editar rutina" para prescribir ejercicios.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rutina.ejercicios.map((ej, index) => (
                  <div
                    key={ej.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-[#2B6CB0]">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{ej.nombre}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{ej.descripcion}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {ej.parte_cuerpo}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                      <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-slate-500">Series: </span>
                        <span className="font-semibold text-slate-900">{ej.series}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-slate-500">Repeticiones: </span>
                        <span className="font-semibold text-slate-900">{ej.repeticiones}</span>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-slate-500">Frecuencia: </span>
                        <span className="font-semibold text-slate-900">{ej.frecuencia_diaria}x/día</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Evolución */}
        {activeTab === "evolucion" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Evolución del tratamiento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-medium text-slate-500 mb-4">Cumplimiento semanal</h3>
                <div className="space-y-3">
                  {evolucion.map((sem) => (
                    <div key={sem.semana}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">{sem.semana}</span>
                        <span className="font-semibold text-slate-900">{sem.cumplimiento}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2B6CB0] to-cyan-400 transition-all"
                          style={{ width: `${sem.cumplimiento}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-medium text-slate-500 mb-4">Dolor promedio semanal</h3>
                <div className="space-y-3">
                  {evolucion.map((sem) => {
                    const dolorColor =
                      sem.dolor_promedio <= 3
                        ? "text-emerald-600 bg-emerald-50"
                        : sem.dolor_promedio <= 6
                          ? "text-amber-600 bg-amber-50"
                          : "text-rose-600 bg-rose-50";
                    return (
                      <div key={sem.semana} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{sem.semana}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${dolorColor}`}>
                          <AlertCircle className="size-3" />
                          {sem.dolor_promedio}/10
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>
                  El paciente ha completado el <strong>92%</strong> de su rutina en la última semana.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prescripcion Modal */}
      {showPrescripcion && (
        <PrescripcionModal
          paciente={paciente}
          rutina={rutina}
          biblioteca={biblioteca}
          onSave={(nuevaRutina) => {
            setRutina(nuevaRutina);
            setShowPrescripcion(false);
          }}
          onClose={() => setShowPrescripcion(false)}
        />
      )}
    </div>
  );
}
