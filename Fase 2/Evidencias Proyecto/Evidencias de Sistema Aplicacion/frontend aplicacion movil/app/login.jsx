import { useState } from "react"
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native"

import { supabase } from "../lib/supabase.js"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      alert(error.message)
      return
    }

    alert("Login correcto")
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          Iniciar Sesión
        </Text>

        <Text style={styles.subtitle}>
          Ingresa para continuar
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Correo electrónico
          </Text>

          <TextInput
            placeholder="Tucorreo@gmail.com"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Contraseña
          </Text>

          <TextInput
            placeholder="••••••••••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={handleLogin}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            Ingresar
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 30,
  },

  inputContainer: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
})