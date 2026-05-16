import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type ProgresoRecord = {
  id: string;
  fecha_registro: string;
  nivel_dolor: number | null;
  completado: boolean;
  ejercicio_nombre: string;
};

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDolor, setSelectedDolor] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [historial, setHistorial] = useState<ProgresoRecord[]>([]);

  useEffect(() => {
    fetchHistorial();
  }, []);

  async function fetchHistorial() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pacienteData } = await supabase
        .from("pacientes")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!pacienteData) return;

      const { data: planesData } = await supabase
        .from("planes_tratamiento")
        .select(
          `id, plan_detalle!inner(
            id,
            seguimiento_progreso(id, fecha_registro, nivel_dolor, completado),
            ejercicio:ejercicios(nombre)
          )`
        )
        .eq("paciente_id", pacienteData.id);

      const records: ProgresoRecord[] = [];

      if (planesData) {
        for (const plan of planesData) {
          if (plan.plan_detalle) {
            for (const detalle of plan.plan_detalle) {
              const ejercicio = Array.isArray(detalle.ejercicio)
                ? detalle.ejercicio[0]
                : detalle.ejercicio;

              if (detalle.seguimiento_progreso) {
                for (const prog of detalle.seguimiento_progreso) {
                  records.push({
                    id: prog.id,
                    fecha_registro: prog.fecha_registro,
                    nivel_dolor: prog.nivel_dolor,
                    completado: prog.completado,
                    ejercicio_nombre: ejercicio?.nombre || "Ejercicio",
                  });
                }
              }
            }
          }
        }
      }

      records.sort(
        (a, b) =>
          new Date(b.fecha_registro).getTime() -
          new Date(a.fecha_registro).getTime()
      );

      setHistorial(records.slice(0, 20));
    } catch (error) {
      console.error("Error fetching historial:", error);
    } finally {
      setLoading(false);
    }
  }

  async function guardarRegistro() {
    if (selectedDolor === null) {
      Alert.alert("Error", "Selecciona tu nivel de dolor.");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pacienteData } = await supabase
        .from("pacientes")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!pacienteData) return;

      const { data: planesData } = await supabase
        .from("planes_tratamiento")
        .select("id, plan_detalle!inner(id)")
        .eq("paciente_id", pacienteData.id)
        .eq("estado", "activo")
        .limit(1);

      if (!planesData || planesData.length === 0) {
        Alert.alert("Error", "No tienes un plan de tratamiento activo.");
        setSaving(false);
        return;
      }

      const planDetalle = planesData[0].plan_detalle?.[0];
      if (!planDetalle) {
        Alert.alert("Error", "No hay ejercicios en tu plan.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("seguimiento_progreso")
        .insert([
          {
            plan_detalle_id: planDetalle.id,
            nivel_dolor: selectedDolor,
            completado: true,
          },
        ]);

      if (error) throw error;

      Alert.alert("Éxito", "Registro guardado correctamente.");
      setSelectedDolor(null);
      setShowForm(false);
      fetchHistorial();
    } catch (error) {
      console.error("Error guardando registro:", error);
      Alert.alert("Error", "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }

  const getDolorEmoji = (nivel: number) => {
    if (nivel <= 2) return "😊";
    if (nivel <= 4) return "🙂";
    if (nivel <= 6) return "😐";
    if (nivel <= 8) return "😣";
    return "😫";
  };

  const getDolorColor = (nivel: number) => {
    if (nivel <= 2) return "#38A169";
    if (nivel <= 4) return "#68D391";
    if (nivel <= 6) return "#D69E2E";
    if (nivel <= 8) return "#ED8936";
    return "#E53E3E";
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <Text style={styles.title}>Mi Progreso</Text>
          <Text style={styles.subtitle}>Seguimiento de recuperación</Text>
        </View>

        <View style={styles.registerCard}>
          <Ionicons name="analytics" size={32} color="#0a7ea4" />
          <Text style={styles.registerTitle}>¿Cómo te sientes hoy?</Text>
          <Text style={styles.registerSubtitle}>
            Registra tu nivel de dolor
          </Text>
          <Pressable
            style={styles.registerButton}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={styles.registerButtonText}>
              {showForm ? "Cancelar" : "Registrar"}
            </Text>
          </Pressable>
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nivel de dolor (1-10)</Text>
            <View style={styles.dolorGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((nivel) => (
                <Pressable
                  key={nivel}
                  style={[
                    styles.dolorButton,
                    selectedDolor === nivel && [
                      styles.dolorButtonSelected,
                      { borderColor: getDolorColor(nivel) },
                    ],
                  ]}
                  onPress={() => setSelectedDolor(nivel)}
                >
                  <Text style={styles.dolorEmoji}>{getDolorEmoji(nivel)}</Text>
                  <Text
                    style={[
                      styles.dolorNumber,
                      selectedDolor === nivel && {
                        color: getDolorColor(nivel),
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {nivel}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={guardarRegistro}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar registro</Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Historial</Text>

          {historial.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                No hay registros de progreso
              </Text>
            </View>
          ) : (
            historial.map((record) => (
              <View key={record.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDolor}>
                    {getDolorEmoji(record.nivel_dolor || 5)}{" "}
                    <Text
                      style={[
                        styles.historyDolorNumber,
                        { color: getDolorColor(record.nivel_dolor || 5) },
                      ]}
                    >
                      {record.nivel_dolor}/10
                    </Text>
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatFecha(record.fecha_registro)}
                  </Text>
                </View>
                <Text style={styles.historyExercise}>
                  {record.ejercicio_nombre}
                </Text>
                {record.completado && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#38A169" />
                    <Text style={styles.completedText}>Completado</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
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
  registerCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  registerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    marginTop: 12,
  },
  registerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
    textAlign: "center",
    marginBottom: 16,
  },
  dolorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  dolorButton: {
    width: 60,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  dolorButtonSelected: {
    backgroundColor: "#e8f4f8",
  },
  dolorEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  dolorNumber: {
    fontSize: 14,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  historySection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDolor: {
    fontSize: 18,
    fontWeight: "600",
  },
  historyDolorNumber: {
    fontWeight: "700",
  },
  historyDate: {
    fontSize: 12,
    color: "#999",
  },
  historyExercise: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f0fff4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: "#38A169",
    fontWeight: "600",
  },
});
