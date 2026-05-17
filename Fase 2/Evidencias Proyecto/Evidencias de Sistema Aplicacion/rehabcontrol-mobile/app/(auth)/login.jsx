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
  ActivityIndicator,
  Alert,
} from "react-native";

import { useRouter } from "expo-router";
import { Colors } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [authMode, setAuthMode] = useState("login"); // 'login', 'requestOtp', 'verifyOtp', 'createPassword'
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const checkRoleAndRedirect = async (userId) => {
    const { data: usuario, error: roleError } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", userId)
      .single();

    if (roleError || !usuario) {
      Alert.alert("Error", "No se pudo verificar tu usuario.");
      await supabase.auth.signOut();
      return;
    }

    if (usuario.rol !== "paciente") {
      Alert.alert("Acceso denegado", "Los kinesiólogos y administradores deben usar la aplicación web.");
      await supabase.auth.signOut();
      return;
    }

    router.replace("/(main)/home");
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert("Error", "Correo o contraseña inválidos.");
        } else {
          Alert.alert("Error", error.message);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        Alert.alert("Error", "No se pudo crear la sesión.");
        setLoading(false);
        return;
      }

      await checkRoleAndRedirect(data.session.user.id);
    } catch (err) {
      Alert.alert("Error", "No fue posible iniciar sesión. Intenta nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;
      
      Alert.alert("Código enviado", "Revisa tu correo por el código de acceso.");
      setAuthMode("verifyOtp");
    } catch(err) {
      Alert.alert("Error", "No se pudo enviar el código. Verifica el correo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("Error", "Ingresa el código que recibiste por correo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: "email"
      });

      if (error) throw error;
      
      if (data.session) {
        setAuthMode("createPassword");
      }
    } catch (err) {
      Alert.alert("Error", "Código inválido o expirado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async () => {
    if (password.length < 8) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ 
        password: password.trim() 
      });

      if (error) throw error;

      Alert.alert("Éxito", "Contraseña creada exitosamente.");
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await checkRoleAndRedirect(sessionData.session.user.id);
      } else {
        setAuthMode("login");
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo actualizar la contraseña.");
      console.error(err);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.welcomeText}>
            {authMode === "createPassword" ? "Crea tu contraseña" 
             : authMode === "verifyOtp" ? "Verifica tu correo"
             : "Bienvenido"}
          </Text>
          <Text style={styles.instructionText}>
            {authMode === "createPassword" ? "Ingresa una contraseña segura para tu cuenta" 
             : authMode === "verifyOtp" ? "Ingresa el código que enviamos a tu correo"
             : authMode === "requestOtp" ? "Te enviaremos un código para acceder por primera vez"
             : "Ingresa tus credenciales para continuar"}
          </Text>

          {['login', 'requestOtp'].includes(authMode) && (
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
          )}

          {authMode === "login" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#999"
                onSubmitEditing={handleLogin}
              />
            </View>
          )}

          {authMode === "verifyOtp" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código de acceso</Text>
              <TextInput
                placeholder="Ingresa tu código"
                value={otp}
                onChangeText={setOtp}
                style={styles.input}
                keyboardType="number-pad"
                placeholderTextColor="#999"
                onSubmitEditing={handleVerifyOtp}
              />
            </View>
          )}

          {authMode === "createPassword" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#999"
                onSubmitEditing={handleCreatePassword}
              />
            </View>
          )}

          <Pressable
            onPress={
              authMode === "login" ? handleLogin
              : authMode === "requestOtp" ? handleRequestOtp
              : authMode === "verifyOtp" ? handleVerifyOtp
              : handleCreatePassword
            }
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              pressed && !loading && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {authMode === "login" ? "Ingresar"
                 : authMode === "requestOtp" ? "Enviar código"
                 : authMode === "verifyOtp" ? "Verificar"
                 : "Guardar contraseña"}
              </Text>
            )}
          </Pressable>

          {authMode === "login" && (
            <Pressable onPress={() => setAuthMode("requestOtp")} style={styles.linkContainer}>
              <Text style={styles.linkText}>¿Primera vez? Obtener código de acceso</Text>
            </Pressable>
          )}

          {authMode === "requestOtp" && (
            <Pressable onPress={() => setAuthMode("login")} style={styles.linkContainer}>
              <Text style={styles.linkText}>Ya tengo cuenta, iniciar sesión</Text>
            </Pressable>
          )}

          {authMode === "verifyOtp" && (
            <Pressable onPress={() => setAuthMode("requestOtp")} style={styles.linkContainer}>
              <Text style={styles.linkText}>Reenviar código</Text>
            </Pressable>
          )}
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#0a7ea4",
    fontSize: 14,
    fontWeight: "600",
  }
});
