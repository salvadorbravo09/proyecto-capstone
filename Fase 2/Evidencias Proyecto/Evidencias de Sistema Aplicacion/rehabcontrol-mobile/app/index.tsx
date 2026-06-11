import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", data.session.user.id)
        .single();

      if (usuario?.rol === "paciente") {
        router.replace("/(main)/home");
        return;
      }
      await supabase.auth.signOut();
    }
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0a7ea4" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
});
