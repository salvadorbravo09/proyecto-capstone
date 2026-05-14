import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bienvenido de nuevo, Alex!</Text>
          <Text style={styles.subtitle}>Continuemos tu recuperación</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>12/15</Text>
            <Text style={styles.progressSubtitle}>Ejercicios Completados</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressPercent}>78%</Text>
          </View>
          <Text style={styles.progressLabel}>Progreso de Recuperación</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximas Citas</Text>
            <Pressable>
              <Text style={styles.viewAll}>Ver todo</Text>
            </Pressable>
          </View>

          <View style={styles.appointmentCard}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={24} color="#0a7ea4" />
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.doctorName}>Dra. Sarah Johnson</Text>
              <Text style={styles.doctorSpecialty}>Fisioterapeuta</Text>
              <View style={styles.appointmentTime}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.appointmentDateText}>22 Abr 2026 a las 2:00 PM</Text>
              </View>
            </View>
          </View>

          <View style={styles.appointmentCard}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={24} color="#0a7ea4" />
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.doctorName}>Dr. Michael Chen</Text>
              <Text style={styles.doctorSpecialty}>Medicina Deportiva</Text>
              <View style={styles.appointmentTime}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.appointmentDateText}>25 Abr 2026 a las 10:30 AM</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ejercicios de Hoy</Text>
            <Pressable>
              <Text style={styles.viewAll}>Ver todo</Text>
            </Pressable>
          </View>

          <View style={styles.exerciseCard}>
            <View style={styles.exerciseIcon}>
              <Ionicons name="fitness" size={20} color="#0a7ea4" />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>Estiramiento de Flexión de Rodilla</Text>
              <Text style={styles.exerciseDuration}>10 min</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>

          <View style={styles.exerciseCard}>
            <View style={styles.exerciseIcon}>
              <Ionicons name="fitness" size={20} color="#0a7ea4" />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>Fortalecimiento de Cadera</Text>
              <Text style={styles.exerciseDuration}>15 min</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>

          <View style={styles.exerciseCard}>
            <View style={styles.exerciseIcon}>
              <Ionicons name="fitness" size={20} color="#0a7ea4" />
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>Entrenamiento de Equilibrio</Text>
              <Text style={styles.exerciseDuration}>12 min</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>

        <Pressable style={styles.trackButton}>
          <View style={styles.trackButtonContent}>
            <Ionicons name="analytics-outline" size={24} color="white" />
            <Text style={styles.trackButtonText}>Seguimiento de Hoy</Text>
          </View>
          <Text style={styles.trackButtonSubtext}>Registra tu nivel de dolor y movilidad</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
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
    width: "78%",
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