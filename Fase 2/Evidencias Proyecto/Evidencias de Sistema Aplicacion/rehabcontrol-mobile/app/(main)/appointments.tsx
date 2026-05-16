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

type Cita = {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  motivo_consulta: string | null;
  kinesiologo: { nombre: string; apellido: string }[] | null;
};

export default function AppointmentsScreen() {
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);

  useEffect(() => {
    fetchCitas();
  }, []);

  async function fetchCitas() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pacienteData } = await supabase
        .from("pacientes")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!pacienteData) return;

      const { data } = await supabase
        .from("citas")
        .select("id, fecha, hora, estado, motivo_consulta, kinesiologo:kinesiologos(nombre, apellido)")
        .eq("paciente_id", pacienteData.id)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true });

      setCitas(data || []);
    } catch (error) {
      console.error("Error fetching citas:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha + "T00:00:00");
    return date.toLocaleDateString("es-CL", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatHora = (hora: string) => hora.substring(0, 5);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "agendada":
        return "#D69E2E";
      case "asistida":
        return "#38A169";
      case "cancelada":
        return "#E53E3E";
      default:
        return "#64748B";
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
          <Text style={styles.title}>Mis Citas</Text>
          <Text style={styles.subtitle}>Historial de atenciones</Text>
        </View>

        {citas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes citas registradas</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {citas.map((cita) => (
              <View key={cita.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{formatFecha(cita.fecha)}</Text>
                  </View>
                  <View
                    style={[
                      styles.estadoBadge,
                      { backgroundColor: getEstadoColor(cita.estado) },
                    ]}
                  >
                    <Text style={styles.estadoText}>{cita.estado}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{formatHora(cita.hora)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {cita.kinesiologo && cita.kinesiologo.length > 0
                        ? `${cita.kinesiologo[0].nombre} ${cita.kinesiologo[0].apellido}`
                        : "Kinesiólogo"}
                    </Text>
                  </View>
                  {cita.motivo_consulta && (
                    <View style={styles.infoRow}>
                      <Ionicons name="document-text-outline" size={16} color="#666" />
                      <Text style={styles.infoText}>{cita.motivo_consulta}</Text>
                    </View>
                  )}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateBadge: {
    backgroundColor: "#e8f4f8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
});
