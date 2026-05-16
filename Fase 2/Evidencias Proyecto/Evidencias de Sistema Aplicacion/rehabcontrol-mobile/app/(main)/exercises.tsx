import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type Ejercicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  parte_cuerpo: string | null;
  url_multimedia: string | null;
  series: number;
  repeticiones: number;
  frecuencia_diaria: number;
  completado: boolean;
};

export default function ExercisesScreen() {
  const [loading, setLoading] = useState(true);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);

  useEffect(() => {
    fetchEjercicios();
  }, []);

  async function fetchEjercicios() {
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

      const { data: planesData } = await supabase
        .from("planes_tratamiento")
        .select(
          `id, plan_detalle!inner(
            id,
            series,
            repeticiones,
            frecuencia_diaria,
            ejercicio:ejercicios(id, nombre, descripcion, parte_cuerpo, url_multimedia)
          )`
        )
        .eq("paciente_id", pacienteData.id)
        .eq("estado", "activo");

      const ejerciciosList: Ejercicio[] = [];

      if (planesData) {
        for (const plan of planesData) {
          if (plan.plan_detalle) {
            for (const detalle of plan.plan_detalle) {
              const ejercicio = Array.isArray(detalle.ejercicio)
                ? detalle.ejercicio[0]
                : detalle.ejercicio;

              if (ejercicio) {
                const { data: progData } = await supabase
                  .from("seguimiento_progreso")
                  .select("completado")
                  .eq("plan_detalle_id", detalle.id)
                  .gte("fecha_registro", today)
                  .limit(1);

                ejerciciosList.push({
                  id: detalle.id,
                  nombre: ejercicio.nombre,
                  descripcion: ejercicio.descripcion,
                  parte_cuerpo: ejercicio.parte_cuerpo,
                  url_multimedia: ejercicio.url_multimedia,
                  series: detalle.series,
                  repeticiones: detalle.repeticiones,
                  frecuencia_diaria: detalle.frecuencia_diaria,
                  completado: progData?.[0]?.completado || false,
                });
              }
            }
          }
        }
      }

      setEjercicios(ejerciciosList);
    } catch (error) {
      console.error("Error fetching ejercicios:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCompletado(id: string, current: boolean) {
    try {
      const today = new Date().toISOString();

      if (current) {
        await supabase
          .from("seguimiento_progreso")
          .update({ completado: false })
          .eq("id", id);
      } else {
        await supabase
          .from("seguimiento_progreso")
          .insert([{ plan_detalle_id: id, completado: true, fecha_registro: today }]);
      }

      fetchEjercicios();
    } catch (error) {
      console.error("Error updating progreso:", error);
    }
  }

  const getParteCuerpoIcon = (parte: string | null) => {
    switch (parte?.toLowerCase()) {
      case "rodilla":
        return "walk-outline";
      case "cadera":
        return "body-outline";
      case "espalda":
        return "accessibility-outline";
      case "hombro":
        return "hand-left-outline";
      default:
        return "fitness-outline";
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
          <Text style={styles.title}>Mis Ejercicios</Text>
          <Text style={styles.subtitle}>Plan de tratamiento activo</Text>
        </View>

        {ejercicios.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No tienes ejercicios asignados
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {ejercicios.map((ejercicio) => (
              <Pressable
                key={ejercicio.id}
                style={[
                  styles.card,
                  ejercicio.completado && styles.cardCompleted,
                ]}
                onPress={() => toggleCompletado(ejercicio.id, ejercicio.completado)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={getParteCuerpoIcon(ejercicio.parte_cuerpo)}
                      size={24}
                      color={ejercicio.completado ? "#38A169" : "#0a7ea4"}
                    />
                  </View>
                  <View
                    style={[
                      styles.checkCircle,
                      ejercicio.completado && styles.checkCircleCompleted,
                    ]}
                  >
                    {ejercicio.completado && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.exerciseName}>{ejercicio.nombre}</Text>
                  {ejercicio.descripcion && (
                    <Text style={styles.exerciseDesc}>
                      {ejercicio.descripcion}
                    </Text>
                  )}
                  <View style={styles.exerciseMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="repeat-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>
                        {ejercicio.series} series × {ejercicio.repeticiones}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>
                        {ejercicio.frecuencia_diaria}x al día
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
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
  cardCompleted: {
    backgroundColor: "#f0fff4",
    borderColor: "#38A169",
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleCompleted: {
    backgroundColor: "#38A169",
    borderColor: "#38A169",
  },
  cardBody: {
    gap: 6,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  exerciseDesc: {
    fontSize: 14,
    color: "#666",
  },
  exerciseMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
  },
});
