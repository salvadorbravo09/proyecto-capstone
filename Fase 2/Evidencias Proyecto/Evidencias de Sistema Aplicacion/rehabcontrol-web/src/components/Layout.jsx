import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Home, Calendar, Users, LogOut, Bell, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificacionesPendientes, setNotificacionesPendientes] = useState(0);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      let nombreCompleto = user.email.split("@")[0];
      let rol = "paciente";

      if (usuario) {
        rol = usuario.rol;

        if (usuario.rol === "kinesiologo") {
          const { data: kinData } = await supabase
            .from("kinesiologos")
            .select("nombre, apellido")
            .eq("usuario_id", user.id)
            .single();
          if (kinData) {
            nombreCompleto = `${kinData.nombre} ${kinData.apellido}`.trim();
          }
        } else if (usuario.rol === "admin") {
          nombreCompleto = "Administrador";
        } else if (usuario.rol === "paciente") {
          const { data: pacData } = await supabase
            .from("pacientes")
            .select("nombre, apellido")
            .eq("usuario_id", user.id)
            .single();
          if (pacData) {
            nombreCompleto = `${pacData.nombre || ''} ${pacData.apellido || ''}`.trim();
          }
        }
      }

      setCurrentUser({
        id: usuario?.id || user.id,
        email: user.email,
        nombre_completo: nombreCompleto,
        rol,
      });
      setLoading(false);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchNotificaciones() {
      try {
        const { data, error } = await supabase
          .from("notificaciones")
          .select("id", { count: "exact", head: true })
          .eq("confirmada", false);

        if (!error && data !== null) {
          setNotificacionesPendientes(typeof data === 'number' ? data : 0);
        }
      } catch (err) {
        console.error("Error fetching notificaciones:", err);
      }
    }
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("authenticated");
    if (!isAuthenticated && !loading) {
      navigate("/login");
    }
  }, [navigate, loading]);

  const handleLogout = async () => {
    localStorage.removeItem("authenticated");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navItems = [
    { 
      to: "/", 
      label: "Dashboard", 
      icon: Home, 
      color: "text-blue-500",
      bgHover: "hover:bg-blue-50",
      bgActive: "bg-blue-600"
    },
    { 
      to: "/agenda", 
      label: "Agenda", 
      icon: Calendar, 
      color: "text-emerald-500",
      bgHover: "hover:bg-emerald-50",
      bgActive: "bg-emerald-600"
    },
    { 
      to: "/pacientes", 
      label: "Pacientes", 
      icon: Users, 
      color: "text-purple-500",
      bgHover: "hover:bg-purple-50",
      bgActive: "bg-purple-600"
    },
  ];

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
              <Activity className="size-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white tracking-tight">
                RehabControl
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Panel de Control</p>
            </div>
          </div>
        </div>

        {/* Fecha actual */}
        <div className="px-6 py-4 border-b border-slate-700/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Fecha</p>
          <p className="text-sm text-slate-300 font-medium">
            {format(new Date(), "EEE d, MMM yyyy", { locale: es })}
          </p>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-4 mb-3">Menú</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));

            return (
              <Link key={item.to} to={item.to}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `${item.bgActive} text-white shadow-lg shadow-blue-900/20`
                      : `text-slate-300 ${item.bgHover} hover:${item.color}`
                  }`}
                >
                  <Icon className={`size-5 ${isActive ? "text-white" : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Notificaciones */}
        <div className="p-4 border-t border-slate-700/50">
          <Link to="/notificaciones">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === "/notificaciones"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20"
                  : "text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              <div className="relative">
                <Bell className={`size-5 ${location.pathname === "/notificaciones" ? "text-white" : "text-amber-400"}`} />
                {notificacionesPendientes > 0 && (
                  <span className="absolute -top-2 -right-2 size-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg">
                    {notificacionesPendientes > 9 ? "9+" : notificacionesPendientes}
                  </span>
                )}
              </div>
              <span className="font-medium">Notificaciones</span>
            </div>
          </Link>
        </div>

        {/* Perfil de usuario */}
        <div className="p-4 border-t border-slate-700/50">
          {loading ? (
            <div className="text-center py-4 text-slate-500">
              Cargando...
            </div>
          ) : currentUser ? (
            <>
              <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-slate-800/50">
                <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg">
                  {getInitials(currentUser.nombre_completo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">
                    {currentUser.nombre_completo}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full">
                    {currentUser.rol === 'kinesiologo' ? 'Kinésico' : currentUser.rol}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="size-4 mr-2" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <div className="text-center py-4 text-slate-500">
              Sin sesión
            </div>
          )}
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto bg-slate-100">
        <Outlet />
      </main>
    </div>
  );
}