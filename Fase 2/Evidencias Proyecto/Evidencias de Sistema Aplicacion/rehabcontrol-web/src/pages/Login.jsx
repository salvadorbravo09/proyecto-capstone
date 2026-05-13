import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserRole, isAllowedRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      // Si el componente ya no está activo o no hay sesión, no hacemos nada
      if (!active || !session) {
        return;
      }

      // Si hay sesión, verificamos el rol del usuario
      try {
        const role = await getUserRole(session.user.id);

        if (role && isAllowedRole(role)) {
          localStorage.setItem("authenticated", "true");
          // Redirigir según el rol
          if (role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
          return;
        }

        // Si el rol no es permitido, cerramos la sesión
        await supabase.auth.signOut();
        localStorage.removeItem("authenticated");
      } catch {
        await supabase.auth.signOut();
        localStorage.removeItem("authenticated");
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage("Correo o contraseña inválidos.");
        return;
      }

      const session = data.session;

      if (!session) {
        setMessage("No se pudo crear la sesión.");
        return;
      }

      const role = await getUserRole(session.user.id);

      if (!role || !isAllowedRole(role)) {
        if (role === "paciente") {
          await supabase.auth.signOut();
          localStorage.removeItem("authenticated");
          setMessage("Los pacientes deben usar la aplicación móvil.");
          return;
        }
        await supabase.auth.signOut();
        localStorage.removeItem("authenticated");
        setMessage("Tu usuario no tiene acceso a la web.");
        return;
      }

      localStorage.setItem("authenticated", "true");
      
      // Redirigir según el rol
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      setMessage("No fue posible iniciar sesión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#2B6CB0] via-[#3182CE] to-white p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Branding */}
          <div className="text-center mb-8">
            <h1 className="font-bold text-3xl text-[#2B6CB0] mb-2">
              RehabControl
            </h1>
            <h1 className="text-lg font-semibold text-slate-900">
              Acceso al panel web
            </h1>
            <p className="text-muted-foreground">Sistema de Gestión Clínica</p>
          </div>

          {message ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {message}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-[#2B6CB0] text-white hover:bg-[#245a94]"
              disabled={loading}
            >
              {loading ? "Validando..." : "Iniciar sesión"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
