import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type Recordatorio = {
  id: string;
  tipo: string;
  mensaje: string;
  created_at: string;
};

export default function AlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);

  useEffect(() => {
    fetchRecordatorios();
  }, []);

  async function fetchRecordatorios() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pacienteData } = await supabase
        .from("pacientes")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!pacienteData) return;

      const today = new Date().toISOString().split("T")[0];

      const { data: citasData } = await supabase
        .from("citas")
        .select("id, fecha, hora, estado")
        .eq("paciente_id", pacienteData.id)
        .gte("fecha", today)
        .order("fecha", { ascending: true })
        .limit(5);

      const reminders: Recordatorio[] = [];

      if (citasData) {
        for (const cita of citasData) {
          reminders.push({
            id: cita.id,
            tipo: "cita",
            mensaje: `Tienes una cita el ${new Date(cita.fecha + "T00:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long" })} a las ${cita.hora?.substring(0, 5)}`,
            created_at: cita.fecha,
          });
        }
      }

      const { data: planData } = await supabase
        .from("planes_tratamiento")
        .select("id")
        .eq("paciente_id", pacienteData.id)
        .eq("estado", "activo")
        .limit(1);

      if (planData && planData.length > 0) {
        reminders.push({
          id: "recordatorio-ejercicios",
          tipo: "ejercicio",
          mensaje: "Recuerda hacer tus ejercicios de hoy para mantener tu progreso",
          created_at: today,
        });
      }

      reminders.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRecordatorios(reminders);
    } catch (error) {
      console.error("Error fetching recordatorios:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "cita":
        return "calendar";
      case "ejercicio":
        return "fitness";
      default:
        return "notifications";
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "cita":
        return "#2B6CB0";
      case "ejercicio":
        return "#38A169";
      default:
        return "#805AD5";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Recordatorios</Text>
          <Text style={styles.subtitle}>Tus próximas actividades</Text>
        </View>

        {recordatorios.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay recordatorios</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recordatorios.map((recordatorio) => (
              <View key={recordatorio.id} style={styles.card}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getTipoColor(recordatorio.tipo) + "20" },
                  ]}
                >
                  <Ionicons
                    name={getTipoIcon(recordatorio.tipo)}
                    size={24}
                    color={getTipoColor(recordatorio.tipo)}
                  />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardMessage}>
                    {recordatorio.mensaje}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardMessage: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
});
