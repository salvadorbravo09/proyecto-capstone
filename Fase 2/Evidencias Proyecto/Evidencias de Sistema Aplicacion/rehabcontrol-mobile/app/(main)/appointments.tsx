import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

export default function AppointmentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Citas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a2e",
  },
});