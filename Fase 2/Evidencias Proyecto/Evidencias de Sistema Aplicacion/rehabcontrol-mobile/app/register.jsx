import { useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import DateTimePicker from "@react-native-community/datetimepicker"
import { router } from "expo-router"
import { supabase } from "../lib/supabase.js"; // Ruta relativa directa

// --- UTILIDADES (Recuperadas) ---
function validarRut(rut) {
  if (!rut) return false
  // Valida que tenga puntos y guion según tu lógica original
  return /^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Kk]{1}$/.test(rut)
}

function formatearRut(texto) {
  let limpio = texto.replace(/\./g, "").replace(/-/g, "").toUpperCase()
  limpio = limpio.replace(/[^0-9K]/g, "")
  if (limpio.length > 9) limpio = limpio.slice(0, 9)
  if (limpio.includes("K") && limpio.indexOf("K") !== limpio.length - 1) {
    limpio = limpio.replace(/K/g, "") + "K"
  }
  if (limpio.length <= 1) return limpio
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  let formateado = ""
  let contador = 0
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    formateado = cuerpo[i] + formateado
    contador++
    if (contador === 3 && i !== 0) {
      formateado = "." + formateado
      contador = 0
    }
  }
  return `${formateado}-${dv}`
}

export default function Register() {
  // --- ESTADOS ORIGINALES ---
  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [telefono, setTelefono] = useState("")
  const [prevision, setPrevision] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
      const day = String(selectedDate.getDate()).padStart(2, "0")
      setFechaNacimiento(`${year}-${month}-${day}`)
    }
  }

  const handleRegister = async () => {
    // Validaciones completas
    if (!rut || !nombre || !apellido || !fechaNacimiento || !telefono || !prevision || !email || !password) {
      Alert.alert("Campos incompletos", "Por favor llena todos los datos.")
      return
    }

    if (!validarRut(rut)) {
      Alert.alert("RUT Inválido", "Formato requerido: 12.345.678-9")
      return
    }

    setLoading(true)

    try {
      // 1. Registro en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      })

      if (authError) throw authError

      // 2. Registro en tabla Pacientes (Campos separados como antes)
      const { error: pacienteError } = await supabase
        .from("pacientes")
        .insert({
          rut: rut,
          nombre: nombre,
          apellido: apellido,
          fecha_nacimiento: fechaNacimiento,
          telefono: telefono,
          prevision: prevision,
          correo: email.trim().toLowerCase(),
        })

      if (pacienteError) throw pacienteError

      Alert.alert("Éxito", "Usuario registrado correctamente", [
        { text: "Ir al Login", onPress: () => router.push("/login") }
      ])

    } catch (err) {
      Alert.alert("Error", err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Ingresa tus datos personales</Text>

        {/* RUT con formateo automático */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>RUT</Text>
          <TextInput
            placeholder="11.111.111-K"
            value={rut}
            onChangeText={(t) => setRut(formatearRut(t))}
            style={styles.input}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            placeholder="Ej: Juan"
            value={nombre}
            onChangeText={setNombre}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            placeholder="Ej: Pérez"
            value={apellido}
            onChangeText={setApellido}
            style={styles.input}
          />
        </View>

        {/* Fecha de Nacimiento con DatePicker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Fecha de Nacimiento</Text>
          <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: fechaNacimiento ? "#111" : "#999" }}>
              {fechaNacimiento || "Seleccionar fecha"}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(2000, 0, 1)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            placeholder="912345678"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            maxLength={9}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Previsión</Text>
          <TextInput
            placeholder="Fonasa / Isapre"
            value={prevision}
            onChangeText={setPrevision}
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <Pressable 
          onPress={handleRegister} 
          style={[styles.button, loading && { opacity: 0.7 }]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Registrando..." : "Crear Usuario"}
          </Text>
        </Pressable>

        <Text style={styles.footerText}>
          ¿Ya tienes cuenta? <Text style={styles.link} onPress={() => router.push("/login")}>Inicia sesión</Text>
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f5f5f5" },
  card: { backgroundColor: "white", padding: 20, borderRadius: 15, elevation: 3 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#000", padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  footerText: { textAlign: "center", marginTop: 20, color: "#666" },
  link: { color: "#2563eb", fontWeight: "bold" }
})