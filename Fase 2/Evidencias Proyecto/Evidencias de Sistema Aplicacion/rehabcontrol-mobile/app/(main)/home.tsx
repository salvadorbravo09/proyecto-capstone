import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  prevision: string | null;
};

type Cita = {
  id: string;
  fecha: string;
  hora: string;
  estados: { nombre: string } | null;
  kinesiologo: { nombre: string; apellido: string }[] | null;
};

type Ejercicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  parte_cuerpo: string | null;
  series: number;
  repeticiones: number;
  frecuencia_diaria: number;
};

type ProgresoRecord = {
  id: string;
  fecha_registro: string;
  completado: boolean;
  nivel_dolor: number | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [progresoHoy, setProgresoHoy] = useState<ProgresoRecord | null>(null);
  const [totalEjercicios, setTotalEjercicios] = useState(0);
  const [completados, setCompletados] = useState(0);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pacienteData } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido, prevision")
        .eq("usuario_id", user.id)
        .single();

      if (!pacienteData) return;
      setPaciente(pacienteData);

      const today = new Date().toISOString().split("T")[0];
      const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [citasRes, planRes, progresoRes] = await Promise.all([
        supabase
          .from("citas")
          .select("id, fecha, hora, estados(nombre), kinesiologo:kinesiologos(nombre, apellido)")
          .eq("paciente_id", pacienteData.id)
          .gte("fecha", today)
          .lte("fecha", weekEnd)
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true }),
        supabase
          .from("planes_tratamiento")
          .select(
            `id, plan_detalle!inner(
              id,
              series,
              repeticiones,
              frecuencia_diaria,
              ejercicio:ejercicios(id, nombre, descripcion, parte_cuerpo)
            )`
          )
          .eq("paciente_id", pacienteData.id)
          .eq("estado", "activo"),
        supabase
          .from("seguimiento_progreso")
          .select("id, fecha_registro, completado, nivel_dolor")
          .eq("plan_detalle_id", "")
          .gte("fecha_registro", today)
          .limit(1),
      ]);

      setCitas(citasRes.data || []);

      const ejerciciosList: Ejercicio[] = [];
      let total = 0;
      let completadosCount = 0;

      if (planRes.data) {
        for (const plan of planRes.data) {
          if (plan.plan_detalle) {
            for (const detalle of plan.plan_detalle) {
              const ejercicio = Array.isArray(detalle.ejercicio)
                ? detalle.ejercicio[0]
                : detalle.ejercicio;

              if (ejercicio) {
                ejerciciosList.push({
                  id: ejercicio.id,
                  nombre: ejercicio.nombre,
                  descripcion: ejercicio.descripcion,
                  parte_cuerpo: ejercicio.parte_cuerpo,
                  series: detalle.series,
                  repeticiones: detalle.repeticiones,
                  frecuencia_diaria: detalle.frecuencia_diaria,
                });
                total++;

                const { data: progData } = await supabase
                  .from("seguimiento_progreso")
                  .select("id, fecha_registro, completado, nivel_dolor")
                  .eq("plan_detalle_id", detalle.id)
                  .gte("fecha_registro", today)
                  .limit(1);

                if (progData && progData.length > 0 && progData[0].completado) {
                  completadosCount++;
                }
              }
            }
          }
        }
      }

      setEjercicios(ejerciciosList);
      setTotalEjercicios(total);
      setCompletados(completadosCount);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleSeguimiento = () => {
    router.push("/(main)/progress");
  };

  const getNombre = () => {
    if (!paciente) return "Paciente";
    return paciente.nombre || "Paciente";
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha + "T00:00:00");
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
    };
    return date.toLocaleDateString("es-CL", options);
  };

  const formatHora = (hora: string) => {
    return hora.substring(0, 5);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  const progressPercent = totalEjercicios > 0 ? Math.round((completados / totalEjercicios) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                Hola, {getNombre()}!
              </Text>
              <Text style={styles.subtitle}>Continuemos tu recuperación</Text>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </Pressable>
          </View>
        </View>

        {totalEjercicios > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                {completados}/{totalEjercicios}
              </Text>
              <Text style={styles.progressSubtitle}>
                Ejercicios Completados
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <Text style={styles.progressLabel}>Progreso de Recuperación</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas Citas</Text>
            <Pressable>
              <Text style={styles.viewAll}>Ver todo</Text>
            </Pressable>
          </View>

          {citas.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color="#ccc" />
              <Text style={styles.emptyText}>No hay citas próximas</Text>
            </View>
          ) : (
            citas.slice(0, 3).map((cita) => (
              <View key={cita.id} style={styles.appointmentCard}>
                <View style={styles.doctorAvatar}>
                  <Ionicons name="person" size={24} color="#0a7ea4" />
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.doctorName}>
                    {cita.kinesiologo && cita.kinesiologo.length > 0
                      ? `${cita.kinesiologo[0].nombre} ${cita.kinesiologo[0].apellido}`
                      : "Kinesiólogo"}
                  </Text>
                  <Text style={styles.doctorSpecialty}>
                    {cita.estados?.nombre || "Agendada"}
                  </Text>
                  <View style={styles.appointmentTime}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.appointmentDateText}>
                      {formatFecha(cita.fecha)} a las {formatHora(cita.hora)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ejercicios de Hoy</Text>
            <Pressable onPress={() => router.push("/(main)/exercises")}>
              <Text style={styles.viewAll}>Ver todo</Text>
            </Pressable>
          </View>

          {ejercicios.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="fitness-outline" size={32} color="#ccc" />
              <Text style={styles.emptyText}>
                No tienes ejercicios asignados
              </Text>
            </View>
          ) : (
            ejercicios.slice(0, 3).map((ejercicio) => (
              <Pressable
                key={ejercicio.id}
                style={styles.exerciseCard}
                onPress={() => router.push("/(main)/exercises")}
              >
                <View style={styles.exerciseIcon}>
                  <Ionicons name="fitness" size={20} color="#0a7ea4" />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ejercicio.nombre}</Text>
                  <Text style={styles.exerciseDuration}>
                    {ejercicio.series} series × {ejercicio.repeticiones} reps
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </Pressable>
            ))
          )}
        </View>

        <Pressable style={styles.trackButton} onPress={handleSeguimiento}>
          <View style={styles.trackButtonContent}>
            <Ionicons name="analytics-outline" size={24} color="white" />
            <Text style={styles.trackButtonText}>Seguimiento de Hoy</Text>
          </View>
          <Text style={styles.trackButtonSubtext}>
            Registra tu nivel de dolor y movilidad
          </Text>
        </Pressable>

        <View style={styles.bottomPadding} />
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  logoutButton: {
    padding: 8,
  },
  progressCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#0a7ea4",
  },
  progressSubtitle: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e8f4f8",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0a7ea4",
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a7ea4",
    marginLeft: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  viewAll: {
    fontSize: 14,
    color: "#0a7ea4",
    fontWeight: "500",
  },
  emptyCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  appointmentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e8f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  appointmentTime: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  appointmentDateText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  exerciseCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f4f8",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  exerciseDuration: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  trackButton: {
    backgroundColor: "#0a7ea4",
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
  },
  trackButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  trackButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  trackButtonSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 8,
  },
  bottomPadding: {
    height: 100,
  },
});
