import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { Colors } from "../../constants/theme";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [otp, setOtp] = useState("");
  const [recoveryOtp, setRecoveryOtp] =
    useState("");

  const [authMode, setAuthMode] =
    useState("login");

  // login
  // requestOtp
  // verifyOtp
  // createPassword
  // forgotPassword
  // verifyRecoveryOtp
  // resetPassword

  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const checkRoleAndRedirect = async (
    userId
  ) => {
    const { data: usuario, error: roleError } =
      await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", userId)
        .single();

    if (roleError || !usuario) {
      Alert.alert(
        "Error",
        "No se pudo verificar tu usuario."
      );

      await supabase.auth.signOut();

      return;
    }

    if (usuario.rol !== "paciente") {
      Alert.alert(
        "Acceso denegado",
        "Los kinesiólogos y administradores deben usar la aplicación web."
      );

      await supabase.auth.signOut();

      return;
    }

    router.replace("/(main)/home");
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Error",
        "Ingresa tu correo y contraseña."
      );

      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });

      if (error) {
        if (
          error.message.includes(
            "Invalid login credentials"
          )
        ) {
          Alert.alert(
            "Error",
            "Correo o contraseña inválidos."
          );
        } else {
          Alert.alert("Error", error.message);
        }

        return;
      }

      if (!data.session) {
        Alert.alert(
          "Error",
          "No se pudo crear la sesión."
        );

        return;
      }

      await checkRoleAndRedirect(
        data.session.user.id
      );

    } catch (err) {
      Alert.alert(
        "Error",
        "No fue posible iniciar sesión. Intenta nuevamente."
      );

      console.error(err);

    } finally {
      setLoading(false);
    }
  };

  // PRIMER INGRESO

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Error",
        "Ingresa tu correo electrónico."
      );

      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithOtp({
          email: email.trim().toLowerCase(),
        });

      if (error) throw error;

      Alert.alert(
        "Código enviado",
        "Revisa tu correo por el código de acceso."
      );

      setAuthMode("verifyOtp");

    } catch (err) {
      Alert.alert(
        "Error",
        "No se pudo enviar el código. Verifica el correo."
      );

      console.error(err);

    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert(
        "Error",
        "Ingresa el código que recibiste por correo."
      );

      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp.trim(),
          type: "email",
        });

      if (error) throw error;

      if (data.session) {
        setAuthMode("createPassword");
      }

    } catch (err) {
      Alert.alert(
        "Error",
        "Código inválido o expirado."
      );

      console.error(err);

    } finally {
      setLoading(false);
    }
  };

const handleCreatePassword = async () => {
  if (password.length < 8) {
    Alert.alert(
      "Error",
      "La contraseña debe tener al menos 8 caracteres."
    );

    return;
  }

  if (password !== confirmPassword) {
    Alert.alert(
      "Error",
      "Las contraseñas no coinciden."
    );

    return;
  }

  setLoading(true);

  try {
    const { error } =
      await supabase.auth.updateUser({
        password: password.trim(),
      });

    if (error) throw error;

    Alert.alert(
      "Éxito",
      "Tu contraseña fue actualizada correctamente."
    );

    // Mantener comportamiento original:
    // usuario queda autenticado automáticamente

    const { data: sessionData } =
      await supabase.auth.getSession();

    if (sessionData.session) {
      await checkRoleAndRedirect(
        sessionData.session.user.id
      );
    } else {
      setAuthMode("login");
    }

  } catch (err) {
    Alert.alert(
      "Error",
      "No se pudo actualizar la contraseña."
    );

    console.error(err);

  } finally {
    setLoading(false);
  }
};

  // RECUPERAR CONTRASEÑA

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Error",
        "Ingresa tu correo electrónico."
      );

      return;
    }

    setLoading(true);

    try {
      const normalizedEmail =
        email.trim().toLowerCase();

      const { error } =
        await supabase.auth.signInWithOtp({
          email: normalizedEmail,
        });

      if (error) throw error;

      Alert.alert(
        "Código enviado",
        "Revisa tu correo para recuperar tu contraseña."
      );

      setAuthMode("verifyRecoveryOtp");

    } catch (err) {
      Alert.alert(
        "Error",
        "No se pudo enviar el código."
      );

      console.error(err);

    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecoveryOtp =
    async () => {
      if (!recoveryOtp.trim()) {
        Alert.alert(
          "Error",
          "Ingresa el código enviado a tu correo."
        );

        return;
      }

      setLoading(true);

      try {
        const { data, error } =
          await supabase.auth.verifyOtp({
            email: email
              .trim()
              .toLowerCase(),
            token: recoveryOtp.trim(),
            type: "email",
          });

        if (error) throw error;

        if (data.session) {
          setAuthMode("resetPassword");
        }

      } catch (err) {
        Alert.alert(
          "Error",
          "Código inválido o expirado."
        );

        console.error(err);

      } finally {
        setLoading(false);
      }
    };

  const handleResetPassword = async () => {
    if (password.length < 8) {
      Alert.alert(
        "Error",
        "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Error",
        "Las contraseñas no coinciden."
      );

      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: password.trim(),
        });

      if (error) throw error;

      Alert.alert(
        "Éxito",
        "Tu contraseña fue actualizada correctamente."
      );

      setPassword("");
      setConfirmPassword("");
      setRecoveryOtp("");

      setAuthMode("login");

    } catch (err) {
      Alert.alert(
        "Error",
        "No se pudo actualizar la contraseña."
      );

      console.error(err);

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>
            RehabControl
          </Text>

          <Text style={styles.subtitle}>
            Control de Rehabilitación
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.welcomeText}>
            {authMode ===
            "createPassword"
              ? "Crear nueva contraseña"
              : authMode === "verifyOtp"
              ? "Verifica tu correo"
              : authMode ===
                "forgotPassword"
              ? "Recuperar contraseña"
              : authMode ===
                "verifyRecoveryOtp"
              ? "Verifica tu código"
              : authMode ===
                "resetPassword"
              ? "Nueva contraseña"
              : "Bienvenido"}
          </Text>

          <Text
            style={styles.instructionText}
          >
            {authMode ===
            "createPassword"
              ? "Ingresa tu nueva contraseña"
              : authMode === "verifyOtp"
              ? "Ingresa el código enviado a tu correo"
              : authMode ===
                "requestOtp"
              ? "Te enviaremos un código para acceder por primera vez"
              : authMode ===
                "forgotPassword"
              ? "Te enviaremos un código para recuperar tu contraseña"
              : authMode ===
                "verifyRecoveryOtp"
              ? "Ingresa el código de recuperación"
              : authMode ===
                "resetPassword"
              ? "Crea tu nueva contraseña"
              : "Ingresa tus credenciales para continuar"}
          </Text>

          {[
            "login",
            "requestOtp",
            "forgotPassword",
          ].includes(authMode) && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Correo electrónico
              </Text>

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
              <Text style={styles.label}>
                Contraseña
              </Text>

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
              <Text style={styles.label}>
                Código de acceso
              </Text>

              <TextInput
                placeholder="Ingresa tu código"
                value={otp}
                onChangeText={setOtp}
                style={styles.input}
                keyboardType="number-pad"
                placeholderTextColor="#999"
                onSubmitEditing={
                  handleVerifyOtp
                }
              />
            </View>
          )}

          {authMode ===
            "verifyRecoveryOtp" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Código de recuperación
              </Text>

              <TextInput
                placeholder="Ingresa tu código"
                value={recoveryOtp}
                onChangeText={
                  setRecoveryOtp
                }
                style={styles.input}
                keyboardType="number-pad"
                placeholderTextColor="#999"
                onSubmitEditing={
                  handleVerifyRecoveryOtp
                }
              />
            </View>
          )}

          {authMode ===
            "createPassword" && (
            <>
              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  Nueva contraseña
                </Text>

                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                />
              </View>

              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  Confirmar contraseña
                </Text>

                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={
                    setConfirmPassword
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                  onSubmitEditing={
                    handleCreatePassword
                  }
                />
              </View>
            </>
          )}

          {authMode ===
            "resetPassword" && (
            <>
              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  Nueva contraseña
                </Text>

                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                />
              </View>

              <View
                style={styles.inputGroup}
              >
                <Text style={styles.label}>
                  Confirmar contraseña
                </Text>

                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={
                    setConfirmPassword
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                  onSubmitEditing={
                    handleResetPassword
                  }
                />
              </View>
            </>
          )}

          <Pressable
            onPress={
              authMode === "login"
                ? handleLogin
                : authMode ===
                  "requestOtp"
                ? handleRequestOtp
                : authMode ===
                  "verifyOtp"
                ? handleVerifyOtp
                : authMode ===
                  "forgotPassword"
                ? handleForgotPassword
                : authMode ===
                  "verifyRecoveryOtp"
                ? handleVerifyRecoveryOtp
                : authMode ===
                  "resetPassword"
                ? handleResetPassword
                : handleCreatePassword
            }
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              pressed &&
                !loading &&
                styles.buttonPressed,
              loading &&
                styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={styles.buttonText}
              >
                {authMode === "login"
                  ? "Ingresar"
                  : authMode ===
                    "requestOtp"
                  ? "Enviar código"
                  : authMode ===
                    "verifyOtp"
                  ? "Verificar código"
                  : authMode ===
                    "forgotPassword"
                  ? "Enviar código"
                  : authMode ===
                    "verifyRecoveryOtp"
                  ? "Verificar código"
                  : authMode ===
                    "resetPassword"
                  ? "Actualizar contraseña"
                  : "Guardar contraseña"}
              </Text>
            )}
          </Pressable>

          {authMode === "login" && (
            <>
              <Pressable
                onPress={() =>
                  setAuthMode(
                    "requestOtp"
                  )
                }
                style={
                  styles.linkContainer
                }
              >
                <Text style={styles.linkText}>
                  ¿Primera vez? Obtener
                  código de acceso
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  setAuthMode(
                    "forgotPassword"
                  )
                }
                style={
                  styles.linkContainer
                }
              >
                <Text style={styles.linkText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
            </>
          )}

          {[
            "requestOtp",
            "forgotPassword",
            "verifyOtp",
            "createPassword",
            "verifyRecoveryOtp",
            "resetPassword",
          ].includes(authMode) && (
            <Pressable
              onPress={() =>
                setAuthMode("login")
              }
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Volver al inicio de sesión
              </Text>
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
    backgroundColor:
      Colors.light.background,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  },
});