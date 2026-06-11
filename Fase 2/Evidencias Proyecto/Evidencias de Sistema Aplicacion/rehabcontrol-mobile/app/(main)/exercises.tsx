import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type EjercicioConProgreso = {
  plan_detalle_id: string;
  progreso_id: string | null;
  nombre: string;
  descripcion: string | null;
  parte_cuerpo: string | null;
  url_multimedia: string | null;
  series: number;
  repeticiones: number;
  frecuencia_diaria: number;
  completado: boolean;
};

type ProgressRecord = {
  id: string;
  plan_detalle_id: string;
  completado: boolean;
};

export default function ExercisesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ejercicios, setEjercicios] = useState<EjercicioConProgreso[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const player = useVideoPlayer(null);

  useEffect(() => {
    if (videoUrl) {
      player.replace(videoUrl);
      player.play();
    }
  }, [videoUrl]);

  useEffect(() => {
    fetchEjercicios();
  }, []);

  async function fetchEjercicios() {
    try {
      setError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          )`,
        )
        .eq("paciente_id", pacienteData.id)
        .is("fecha_fin", null);

      if (!planesData || planesData.length === 0) {
        setEjercicios([]);
        return;
      }

      const detalleIds: string[] = [];
      const ejerciciosRaw: {
        detalle: any;
        ejercicio: any;
      }[] = [];

      for (const plan of planesData) {
        if (!plan.plan_detalle) continue;
        for (const detalle of plan.plan_detalle) {
          const ejercicio = Array.isArray(detalle.ejercicio)
            ? detalle.ejercicio[0]
            : detalle.ejercicio;
          if (!ejercicio) continue;
          detalleIds.push(detalle.id);
          ejerciciosRaw.push({ detalle, ejercicio });
        }
      }

      const { data: progresos } = await supabase
        .from("seguimiento_progreso")
        .select("id, plan_detalle_id, completado")
        .in("plan_detalle_id", detalleIds)
        .gte("fecha_registro", today);

      const progresoMap = new Map<string, ProgressRecord>();
      progresos?.forEach((p: ProgressRecord) => {
        progresoMap.set(p.plan_detalle_id, p);
      });

      const ejerciciosList: EjercicioConProgreso[] = ejerciciosRaw.map(
        ({ detalle, ejercicio }) => {
          const prog = progresoMap.get(detalle.id);
          return {
            plan_detalle_id: detalle.id,
            progreso_id: prog?.id || null,
            nombre: ejercicio.nombre,
            descripcion: ejercicio.descripcion,
            parte_cuerpo: ejercicio.parte_cuerpo,
            url_multimedia: ejercicio.url_multimedia,
            series: detalle.series,
            repeticiones: detalle.repeticiones,
            frecuencia_diaria: detalle.frecuencia_diaria,
            completado: prog?.completado || false,
          };
        },
      );

      setEjercicios(ejerciciosList);
    } catch (error) {
      console.error("Error fetching ejercicios:", error);
      setError("No se pudieron cargar los ejercicios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function toggleCompletado(ej: EjercicioConProgreso) {
    const today = new Date().toISOString();
    const nuevoCompletado = !ej.completado;

    setEjercicios((prev) =>
      prev.map((e) =>
        e.plan_detalle_id === ej.plan_detalle_id
          ? { ...e, completado: nuevoCompletado }
          : e,
      ),
    );

    try {
      if (ej.completado && ej.progreso_id) {
        const { error } = await supabase
          .from("seguimiento_progreso")
          .update({ completado: false })
          .eq("id", ej.progreso_id);

        if (error) throw error;
      } else if (!ej.completado) {
        const { data: newProg, error } = await supabase
          .from("seguimiento_progreso")
          .insert([
            {
              plan_detalle_id: ej.plan_detalle_id,
              completado: true,
              fecha_registro: today,
            },
          ])
          .select("id")
          .single();

        if (error) throw error;

        setEjercicios((prev) =>
          prev.map((e) =>
            e.plan_detalle_id === ej.plan_detalle_id
              ? { ...e, progreso_id: newProg.id }
              : e,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating progreso:", error);
      setEjercicios((prev) =>
        prev.map((e) =>
          e.plan_detalle_id === ej.plan_detalle_id
            ? { ...e, completado: ej.completado }
            : e,
        ),
      );
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEjercicios();
  }, []);

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

  const completados = ejercicios.filter((e) => e.completado).length;
  const total = ejercicios.length;
  const progressPercent = total > 0 ? Math.round((completados / total) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mis Ejercicios</Text>
          <Text style={styles.subtitle}>Plan de tratamiento activo</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { setLoading(true); fetchEjercicios(); }}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {total > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Ionicons name="checkmark-circle" size={20} color="#0a7ea4" />
              <Text style={styles.progressTitle}>
                {completados}/{total} completados hoy
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
          </View>
        )}

        {ejercicios.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="fitness-outline" size={48} color="#d0d5dd" />
            </View>
            <Text style={styles.emptyTitle}>Sin ejercicios asignados</Text>
            <Text style={styles.emptySubtitle}>
              Tu kinesiólogo aún no ha asignado ejercicios.{"\n"}Pronto podrás ver tu rutina aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {ejercicios.map((ej) => (
              <Pressable
                key={ej.plan_detalle_id}
                style={[
                  styles.card,
                  ej.completado && styles.cardCompleted,
                ]}
                onPress={() => toggleCompletado(ej)}
              >
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      ej.completado && styles.iconContainerCompleted,
                    ]}
                  >
                    <Ionicons
                      name={getParteCuerpoIcon(ej.parte_cuerpo)}
                      size={22}
                      color={ej.completado ? "#38A169" : "#0a7ea4"}
                    />
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <Text
                        style={[
                          styles.exerciseName,
                          ej.completado && styles.textCompleted,
                        ]}
                        numberOfLines={1}
                      >
                        {ej.nombre}
                      </Text>
                      <View
                        style={[
                          styles.checkCircle,
                          ej.completado && styles.checkCircleCompleted,
                        ]}
                      >
                        {ej.completado && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </View>
                    </View>

                    {ej.descripcion ? (
                      <Text style={styles.exerciseDesc} numberOfLines={2}>
                        {ej.descripcion}
                      </Text>
                    ) : null}

                    <View style={styles.exerciseMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="repeat-outline" size={13} color="#94a3b8" />
                        <Text style={styles.metaText}>
                          {ej.series} × {ej.repeticiones}
                        </Text>
                      </View>
                      <View style={styles.metaDot} />
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color="#94a3b8" />
                        <Text style={styles.metaText}>
                          {ej.frecuencia_diaria}x / día
                        </Text>
                      </View>
                      {ej.parte_cuerpo && (
                        <>
                          <View style={styles.metaDot} />
                          <View style={styles.metaItem}>
                            <Text style={styles.metaBadge}>
                              {ej.parte_cuerpo}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {ej.url_multimedia && (
                      <TouchableOpacity
                        style={styles.videoButton}
                        onPress={() => setVideoUrl(ej.url_multimedia)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="play-circle" size={16} color="#2B6CB0" />
                        <Text style={styles.videoButtonText}>Ver demo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={!!videoUrl} transparent animationType="fade">
        <View style={styles.videoOverlay}>
          <View style={styles.videoContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVideoUrl(null)}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            {videoUrl && (
              <VideoView
                style={styles.video}
                player={player}
                contentFit="contain"
                nativeControls
              />
            )}
          </View>
        </View>
      </Modal>
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
    fontSize: 15,
    color: "#64748b",
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#dc2626",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  progressCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#0a7ea4",
    minWidth: 36,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: "#f0fff4",
    borderColor: "#bbf7d0",
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e8f4f8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  iconContainerCompleted: {
    backgroundColor: "#dcfce7",
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1a1a2e",
    flex: 1,
    marginRight: 8,
  },
  textCompleted: {
    color: "#38A169",
  },
  exerciseDesc: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    lineHeight: 18,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleCompleted: {
    backgroundColor: "#38A169",
    borderColor: "#38A169",
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#cbd5e1",
  },
  metaBadge: {
    fontSize: 11,
    fontWeight: "500",
    color: "#0a7ea4",
    backgroundColor: "#e8f4f8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 10,
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  videoButtonText: {
    color: "#2B6CB0",
    fontSize: 13,
    fontWeight: "600",
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: -40,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  bottomPadding: {
    height: 100,
  },
});
