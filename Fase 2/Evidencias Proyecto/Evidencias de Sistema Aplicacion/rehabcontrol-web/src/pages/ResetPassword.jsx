import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Activity, Mail, Lock, Loader2, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  async function handleRequestReset(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
      );

      if (error) throw error;

      setMode("verify");
    } catch (error) {
      setMessage(error.message || "No se pudo enviar el código de recuperación.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
      );

      if (error) throw error;

      setMessage("Código reenviado. Revisa tu correo.");
    } catch (error) {
      setMessage(error.message || "No se pudo reenviar el código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "recovery",
      });

      if (error) throw error;

      if (data.session) {
        setMode("reset");
      }
    } catch (error) {
      setMessage("Código inválido o expirado. Solicita uno nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMode("done");
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-white/20 backdrop-blur mb-4 shadow-lg">
              <Activity className="size-8 text-white" />
            </div>
            <h1 className="font-bold text-3xl text-white tracking-tight">
              RehabControl
            </h1>
            <p className="text-blue-100 mt-2 text-sm">
              Recuperación de Contraseña
            </p>
          </div>

          <div className="px-8 py-8">
            {mode === "request" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    ¿Olvidaste tu contraseña?
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Ingresa tu correo y te enviaremos un código para recuperarla
                  </p>
                </div>

                {message ? (
                  <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-rose-500 shrink-0" />
                    {message}
                  </div>
                ) : null}

                <form className="space-y-5" onSubmit={handleRequestReset}>
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
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
                        Enviando...
                      </span>
                    ) : (
                      "Enviar código de recuperación"
                    )}
                  </Button>
                </form>
              </>
            )}

            {mode === "verify" && (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-blue-100 mb-4">
                    <KeyRound className="size-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">
                    Revisa tu correo
                  </h2>
                  <p className="text-sm text-slate-500">
                    Te enviamos un código de 6 dígitos a{" "}
                    <span className="font-medium text-slate-700">{email}</span>
                  </p>
                </div>

                {message ? (
                  <div className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${
                    message === "Código reenviado. Revisa tu correo."
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}>
                    <div className={`size-2 rounded-full shrink-0 ${
                      message === "Código reenviado. Revisa tu correo."
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`} />
                    {message}
                  </div>
                ) : null}

                <form className="space-y-5" onSubmit={handleVerifyCode}>
                  <div className="space-y-2">
                    <label
                      htmlFor="code"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <KeyRound className="size-4 text-blue-500" />
                      Código de recuperación
                    </label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="Ingresa el código de 6 dígitos"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors text-center text-lg tracking-widest font-mono"
                      required
                      maxLength={8}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200"
                    disabled={loading || code.length < 8}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Verificando...
                      </span>
                    ) : (
                      "Verificar código"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                  >
                    ¿No recibiste el código? Reenviar
                  </button>
                </div>
              </>
            )}

            {mode === "reset" && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    Crear nueva contraseña
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Ingresa tu nueva contraseña para acceder al sistema
                  </p>
                </div>

                {message ? (
                  <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-rose-500 shrink-0" />
                    {message}
                  </div>
                ) : null}

                <form className="space-y-5" onSubmit={handleResetPassword}>
                  <div className="space-y-2">
                    <label
                      htmlFor="new-password"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <Lock className="size-4 text-blue-500" />
                      Nueva contraseña
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirm-password"
                      className="text-sm font-medium text-slate-700 flex items-center gap-2"
                    >
                      <Lock className="size-4 text-blue-500" />
                      Confirmar contraseña
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors"
                      required
                      minLength={8}
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
                        Actualizando...
                      </span>
                    ) : (
                      "Actualizar contraseña"
                    )}
                  </Button>
                </form>
              </>
            )}

            {mode === "done" && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-emerald-100 mb-4">
                  <CheckCircle className="size-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                  Contraseña actualizada
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  Tu contraseña se ha cambiado correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
                <Button
                  className="h-12 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200"
                  onClick={() => navigate("/login")}
                >
                  Ir al inicio de sesión
                </Button>
              </div>
            )}

            {mode !== "done" && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
