import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { useRouter } from "expo-router";
import { Colors } from "../../constants/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    router.replace("/(main)/home");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>RehabControl</Text>
          <Text style={styles.subtitle}>Control de Rehabilitación</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.instructionText}>Ingresa tus credenciales para continuar</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              placeholder="correo@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Ingresar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e8f4f8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 8,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonPressed: {
    backgroundColor: "#085a7a",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});