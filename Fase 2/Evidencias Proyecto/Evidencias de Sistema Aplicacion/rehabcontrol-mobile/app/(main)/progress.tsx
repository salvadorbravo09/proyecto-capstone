import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type DiaResumen = {
  fecha: string;
  label: string;
  completados: number;
  total: number;
  porcentaje: number;
  dolorPromedio: number | null;
};

type HistorialItem = {
  id: string;
  fecha: string;
  ejercicio_nombre: string;
  completado: boolean;
  nivel_dolor: number | null;
};

type ProgressData = {
  totalHoy: number;
  completadosHoy: number;
  dolorHoy: number | null;
  dolorId: string | null;
  semanal: DiaResumen[];
  historial: HistorialItem[];
};

const DOLOR_EMOJIS: Record<number, string> = {
  1: "😊", 2: "😊",
  3: "🙂", 4: "🙂",
  5: "😐", 6: "😐",
  7: "😣", 8: "😣",
  9: "😫", 10: "😫",
};

const DOLOR_LABELS: Record<number, string> = {
  1: "Sin dolor",
  2: "Muy leve",
  3: "Leve",
  4: "Molesto",
  5: "Moderado",
  6: "Notable",
  7: "Fuerte",
  8: "Intenso",
  9: "Muy intenso",
  10: "Insoportable",
};

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ProgressData | null>(null);
  const [selectedDolor, setSelectedDolor] = useState<number | null>(null);
  const [savingDolor, setSavingDolor] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
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
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { data: planesData } = await supabase
        .from("planes_tratamiento")
        .select(
          `id, plan_detalle!inner(
            id,
            series,
            repeticiones,
            frecuencia_diaria,
            ejercicio:ejercicios(id, nombre)
          )`
        )
        .eq("paciente_id", pacienteData.id)
        .is("fecha_fin", null);

      if (!planesData || planesData.length === 0) {
        setData(null);
        return;
      }

      const detalleIds: string[] = [];
      const detalleNombres = new Map<string, string>();
      let totalHoy = 0;

      for (const plan of planesData) {
        if (!plan.plan_detalle) continue;
        for (const detalle of plan.plan_detalle) {
          const ejercicio = Array.isArray(detalle.ejercicio)
            ? detalle.ejercicio[0]
            : detalle.ejercicio;
          if (!ejercicio) continue;
          detalleIds.push(detalle.id);
          detalleNombres.set(detalle.id, ejercicio.nombre || "Ejercicio");
          totalHoy += detalle.frecuencia_diaria;
        }
      }

      const [progresoHoyRes, progresosSemanaRes] = await Promise.all([
        supabase
          .from("seguimiento_progreso")
          .select("id, plan_detalle_id, completado, nivel_dolor")
          .in("plan_detalle_id", detalleIds)
          .gte("fecha_registro", today),
        supabase
          .from("seguimiento_progreso")
          .select("id, plan_detalle_id, fecha_registro, completado, nivel_dolor")
          .in("plan_detalle_id", detalleIds)
          .gte("fecha_registro", sevenDaysAgo)
          .lte("fecha_registro", today + "T23:59:59")
          .order("fecha_registro", { ascending: false })
          .limit(200),
      ]);

      const progresosHoy = progresoHoyRes.data || [];
      const progresosSemana = progresosSemanaRes.data || [];

      const completadosHoySet = new Set<string>();
      let dolorHoy: number | null = null;
      let dolorId: string | null = null;

      for (const p of progresosHoy) {
        if (p.completado) completadosHoySet.add(p.plan_detalle_id);
        if (p.nivel_dolor != null) {
          dolorHoy = p.nivel_dolor;
          dolorId = p.id;
        }
      }

      const completadosHoy = completadosHoySet.size;
      totalHoy = detalleIds.length;

      const diasMap = new Map<string, { completados: Set<string>; dolores: number[]; count: number }>();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        diasMap.set(key, { completados: new Set(), dolores: [], count: 0 });
      }

      for (const p of progresosSemana) {
        const day = p.fecha_registro.split("T")[0];
        if (!diasMap.has(day)) continue;
        const entry = diasMap.get(day)!;
        if (p.completado) entry.completados.add(p.plan_detalle_id);
        if (p.nivel_dolor != null) entry.dolores.push(p.nivel_dolor);
        entry.count++;
      }

      const semanal: DiaResumen[] = [];
      const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        const entry = diasMap.get(key)!;
        const totales = detalleIds.length;
        semanal.push({
          fecha: key,
          label: i === 0 ? "Hoy" : diasSemana[d.getDay()],
          completados: entry.completados.size,
          total: totales,
          porcentaje: totales > 0 ? Math.round((entry.completados.size / totales) * 100) : 0,
          dolorPromedio: entry.dolores.length > 0
            ? Math.round((entry.dolores.reduce((a, b) => a + b, 0) / entry.dolores.length) * 10) / 10
            : null,
        });
      }

      const historial: HistorialItem[] = progresosSemana.map((p) => ({
        id: p.id,
        fecha: p.fecha_registro,
        ejercicio_nombre: detalleNombres.get(p.plan_detalle_id) || "Ejercicio",
        completado: p.completado,
        nivel_dolor: p.nivel_dolor,
      }));

      setData({
        totalHoy,
        completadosHoy,
        dolorHoy,
        dolorId,
        semanal,
        historial,
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function guardarDolor() {
    if (selectedDolor === null) return;
    setSavingDolor(true);

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
        .is("fecha_fin", null)
        .limit(1);

      if (!planesData || planesData.length === 0) return;

      const detalle = planesData[0].plan_detalle?.[0];
      if (!detalle) return;

      if (data?.dolorId) {
        await supabase
          .from("seguimiento_progreso")
          .update({ nivel_dolor: selectedDolor })
          .eq("id", data.dolorId);
      } else {
        const { data: newProg } = await supabase
          .from("seguimiento_progreso")
          .insert([{
            plan_detalle_id: detalle.id,
            nivel_dolor: selectedDolor,
            completado: false,
          }])
          .select("id")
          .single();

        if (newProg && data) {
          setData({ ...data, dolorId: newProg.id });
        }
      }

      if (data) {
        setData({ ...data, dolorHoy: selectedDolor });
      }

      setSelectedDolor(null);
    } catch (error) {
      console.error("Error guardando dolor:", error);
    } finally {
      setSavingDolor(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const progressPercent = data && data.totalHoy > 0
    ? Math.round((data.completadosHoy / data.totalHoy) * 100)
    : 0;

  const historialAgrupado = useMemo(() => {
    if (!data) return [];
    const grupos = new Map<string, HistorialItem[]>();
    for (const item of data.historial) {
      const day = item.fecha.split("T")[0];
      if (!grupos.has(day)) grupos.set(day, []);
      grupos.get(day)!.push(item);
    }
    return Array.from(grupos.entries()).slice(0, 14);
  }, [data?.historial]);

  function formatFecha(fecha: string) {
    const date = new Date(fecha + "T00:00:00");
    const hoy = new Date();
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (date.toDateString() === hoy.toDateString()) return "Hoy";
    if (date.toDateString() === ayer.toDateString()) return "Ayer";

    return date.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
    });
  }

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
          <Text style={styles.title}>Mi Progreso</Text>
          <Text style={styles.subtitle}>Seguimiento de recuperación</Text>
        </View>

        {!data ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="analytics-outline" size={48} color="#d0d5dd" />
            </View>
            <Text style={styles.emptyTitle}>Sin plan activo</Text>
            <Text style={styles.emptySubtitle}>
              No tienes un plan de tratamiento activo.{"\n"}
              Tu kinesiólogo asignará ejercicios pronto.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#0a7ea4" />
                <Text style={styles.progressTitle}>Resumen de Hoy</Text>
              </View>
              <View style={styles.progressBody}>
                <Text style={styles.progressCount}>
                  {data.completadosHoy}/{data.totalHoy}
                </Text>
                <Text style={styles.progressLabel}>ejercicios completados</Text>
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

            <View style={styles.dolorCard}>
              <View style={styles.dolorHeader}>
                <Ionicons name="heart-outline" size={20} color="#dc2626" />
                <Text style={styles.dolorTitle}>Registrar Dolor</Text>
              </View>
              <Text style={styles.dolorSubtitle}>
                {data.dolorHoy != null
                  ? `Hoy registraste: ${DOLOR_LABELS[data.dolorHoy] || data.dolorHoy + "/10"}`
                  : "¿Cómo evalúas tu dolor hoy?"}
              </Text>
              <View style={styles.dolorGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((nivel) => {
                  const isSelected = selectedDolor === nivel;
                  const isActive = data.dolorHoy != null && data.dolorHoy === nivel && !isSelected;
                  return (
                    <Pressable
                      key={nivel}
                      style={[
                        styles.dolorButton,
                        isSelected && styles.dolorButtonSelected,
                        isActive && styles.dolorButtonActive,
                      ]}
                      onPress={() => setSelectedDolor(
                        selectedDolor === nivel ? null : nivel
                      )}
                    >
                      <Text style={styles.dolorEmoji}>{DOLOR_EMOJIS[nivel]}</Text>
                      <Text style={[
                        styles.dolorNumber,
                        (isSelected || isActive) && styles.dolorNumberActive,
                      ]}>
                        {nivel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedDolor != null && (
                <Pressable
                  style={[styles.saveButton, savingDolor && styles.saveButtonDisabled]}
                  onPress={guardarDolor}
                  disabled={savingDolor}
                >
                  {savingDolor ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {data.dolorHoy != null ? "Actualizar dolor" : "Guardar dolor"}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={18} color="#0a7ea4" />
                <Text style={styles.sectionTitle}>Últimos 7 Días</Text>
              </View>
              {data.semanal.map((dia) => (
                <View key={dia.fecha} style={styles.barRow}>
                  <Text style={styles.barLabel}>{dia.label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${dia.porcentaje}%`,
                          backgroundColor:
                            dia.porcentaje >= 80 ? "#38A169" :
                            dia.porcentaje >= 50 ? "#D69E2E" :
                            dia.porcentaje >= 25 ? "#ED8936" :
                            "#dc2626",
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.barMeta}>
                    <Text style={styles.barPercent}>{dia.porcentaje}%</Text>
                    {dia.dolorPromedio != null && (
                      <Text style={styles.barDolor}>
                        {DOLOR_EMOJIS[Math.round(dia.dolorPromedio)]}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              {data.semanal.length > 0 && (
                <Text style={styles.semanalFooter}>
                  Dolor promedio semanal:{" "}
                  {(() => {
                    const conDolor = data.semanal.filter(d => d.dolorPromedio != null);
                    if (conDolor.length === 0) return "—";
                    const avg = conDolor.reduce((a, d) => a + d.dolorPromedio!, 0) / conDolor.length;
                    return `${avg.toFixed(1)}/10`;
                  })()}
                </Text>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={18} color="#0a7ea4" />
                <Text style={styles.sectionTitle}>Historial</Text>
              </View>
              {historialAgrupado.length === 0 ? (
                <View style={styles.emptySmall}>
                  <Text style={styles.emptySmallText}>
                    No hay registros en los últimos 7 días
                  </Text>
                </View>
              ) : (
                historialAgrupado.map(([fecha, items]) => (
                  <View key={fecha}>
                    <Text style={styles.historyDateHeader}>
                      {formatFecha(fecha)}
                    </Text>
                    {items.map((item) => (
                      <View key={item.id} style={styles.historyCard}>
                        <View style={styles.historyRow}>
                          <View style={styles.historyLeft}>
                            <Ionicons
                              name={item.completado ? "checkmark-circle" : "ellipse-outline"}
                              size={18}
                              color={item.completado ? "#38A169" : "#d1d5db"}
                            />
                            <Text style={styles.historyExerciseName}>
                              {item.ejercicio_nombre}
                            </Text>
                          </View>
                          {item.nivel_dolor != null && (
                            <View style={styles.historyDolorBadge}>
                              <Text style={styles.historyDolorText}>
                                {DOLOR_EMOJIS[item.nivel_dolor]} {item.nivel_dolor}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </View>
          </>
        )}
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
  progressCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  progressBody: {
    alignItems: "center",
    marginBottom: 12,
  },
  progressCount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#0a7ea4",
  },
  progressLabel: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
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
  dolorCard: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  dolorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  dolorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  dolorSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 16,
  },
  dolorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  dolorButton: {
    width: 52,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  dolorButtonSelected: {
    backgroundColor: "#e8f4f8",
    borderColor: "#0a7ea4",
  },
  dolorButtonActive: {
    backgroundColor: "#f0fff4",
    borderColor: "#38A169",
  },
  dolorEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  dolorNumber: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  dolorNumberActive: {
    color: "#0a7ea4",
    fontWeight: "700",
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#0a7ea4",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  barLabel: {
    width: 36,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
  barMeta: {
    width: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  barPercent: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  barDolor: {
    fontSize: 12,
  },
  semanalFooter: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  emptySmall: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptySmallText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  historyDateHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  historyExerciseName: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  historyDolorBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyDolorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626",
  },
  bottomPadding: {
    height: 100,
  },
});
