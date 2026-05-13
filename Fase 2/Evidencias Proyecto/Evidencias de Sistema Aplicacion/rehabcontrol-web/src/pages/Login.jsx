import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserRole, isAllowedRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Activity, Mail, Lock, Loader2 } from "lucide-react";

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

      if (!active || !session) {
        return;
      }

      try {
        const role = await getUserRole(session.user.id);

        if (role && isAllowedRole(role)) {
          localStorage.setItem("authenticated", "true");
          if (role === "admin") {
            navigate("/admin", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
          return;
        }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/20 backdrop-blur mb-4 shadow-lg">
              <Activity className="size-8 text-white" />
            </div>
            <h1 className="font-bold text-3xl text-white tracking-tight">
              RehabControl
            </h1>
            <p className="text-blue-100 mt-2 text-sm">
              Sistema de Gestión Clínica
            </p>
          </div>

          {/* Formulario */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                Iniciar Sesión
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {message ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500" />
                {message}
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Mail className="size-4 text-blue-500" />
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Lock className="size-4 text-blue-500" />
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Validando...
                  </span>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">
              © 2026 RehabControl. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}