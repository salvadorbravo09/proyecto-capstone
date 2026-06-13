import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUserRole, isAllowedRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  Mail,
  Lock,
  Loader2,
  Calendar,
  Users,
  Dumbbell,
  TrendingUp,
  Smartphone,
} from "lucide-react";

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
    <div className="min-h-screen flex">
      {/* Left: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="size-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="size-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900 tracking-tight">
                RehabControl
              </h1>
              <p className="text-xs text-slate-500">Panel de Control</p>
            </div>
          </div>

          {/* Welcome */}
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">
            Iniciar Sesión
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Ingresa tus credenciales para continuar
          </p>

          {message ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-500 shrink-0" />
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

          {/* Forgot password */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/reset-password")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Patient redirect */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Smartphone className="size-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  ¿Eres paciente?
                </p>
                <p className="text-xs text-slate-500">
                  Usa la aplicación móvil de RehabControl
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative max-w-lg text-center">
          {/* Large icon */}
          <div className="inline-flex items-center justify-center size-24 rounded-3xl bg-white/10 backdrop-blur mb-8 shadow-2xl ring-1 ring-white/20">
            <Activity className="size-12 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">
            RehabControl
          </h2>
          <p className="text-lg text-blue-200/80 mb-12">
            Sistema de Gestión Clínica de Kinesiología
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur p-4 ring-1 ring-white/10">
              <Users className="size-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Pacientes</p>
                <p className="text-xs text-blue-200/60">
                  Gestión y fichas clínicas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur p-4 ring-1 ring-white/10">
              <Calendar className="size-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Agenda</p>
                <p className="text-xs text-blue-200/60">Citas y calendario</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur p-4 ring-1 ring-white/10">
              <Dumbbell className="size-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Ejercicios</p>
                <p className="text-xs text-blue-200/60">Catálogo terapéutico</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/5 backdrop-blur p-4 ring-1 ring-white/10">
              <TrendingUp className="size-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Progreso</p>
                <p className="text-xs text-blue-200/60">
                  Seguimiento de evolución
                </p>
              </div>
            </div>
          </div>

          {/* Mobile app badge */}
          {/* <div className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur px-5 py-3 ring-1 ring-white/20">
            <Smartphone className="size-4 text-blue-300" />
            <span className="text-sm text-blue-100">
              ¿Eres paciente? Descarga la app móvil
            </span>
          </div> */}
        </div>
      </div>
    </div>
  );
}
