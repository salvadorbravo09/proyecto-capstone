import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Bell, Loader2, User, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

export default function Notificaciones() {
  const [loading, setLoading] = useState(true);
  const [notificaciones, setNotificaciones] = useState([]);
  const [confirmando, setConfirmando] = useState(null);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  async function fetchNotificaciones() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notificaciones")
        .select(`
          id,
          tipo,
          mensaje,
          leida,
          confirmada,
          created_at,
          paciente:pacientes(id, nombre, apellido)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotificaciones(data || []);
    } catch (error) {
      console.error("Error fetching notificaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  async function confirmarNotificacion(id) {
    setConfirmando(id);
    try {
      const { error } = await supabase
        .from("notificaciones")
        .update({ confirmada: true, leida: true })
        .eq("id", id);

      if (error) throw error;
      fetchNotificaciones();
    } catch (error) {
      console.error("Error confirmando notificación:", error);
      alert("Error al confirmar notificación");
    } finally {
      setConfirmando(null);
    }
  }

  async function marcarLeida(id) {
    try {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", id);

      if (error) throw error;
      fetchNotificaciones();
    } catch (error) {
      console.error("Error marcando como leída:", error);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-[#2B6CB0]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-semibold text-3xl mb-1">Notificaciones</h1>
        <p className="text-muted-foreground">
          Registro de pacientes pendientes de confirmar
        </p>
      </div>

      {notificaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <Bell className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No hay notificaciones pendientes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notificaciones.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl border p-6 ${
                notif.confirmada
                  ? "border-[#38A169] bg-green-50/30"
                  : notif.leida
                  ? "border-border"
                  : "border-[#2B6CB0] bg-blue-50/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-full bg-[#2B6CB0] text-white flex items-center justify-center font-semibold">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {notif.mensaje || `Paciente registrado`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notif.paciente?.nombre} {notif.paciente?.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(notif.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  {notif.confirmada ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-[#38A169] text-white">
                      <Check className="size-4" />
                      Confirmado
                    </span>
                  ) : (
                    <Button
                      className="bg-[#2B6CB0] hover:bg-[#2C5282]"
                      onClick={() => confirmarNotificacion(notif.id)}
                      disabled={confirmando === notif.id}
                    >
                      {confirmando === notif.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Confirmar"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}