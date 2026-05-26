import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Home, Users, Calendar, UserCog, Settings, LogOut, Shield, Dumbbell } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      if (usuario) {
        setCurrentUser({
          id: usuario.id,
          email: user.email,
          nombre: usuario.nombre || user.email.split("@")[0],
          rol: usuario.rol,
        });
      } else {
        setCurrentUser({
          id: user.id,
          email: user.email,
          nombre: user.email.split("@")[0],
          rol: "admin",
        });
      }
      setLoading(false);
    }
    fetchUser();
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
      to: "/admin", 
      label: "Dashboard", 
      icon: Home, 
      color: "text-cyan-400",
      bgHover: "hover:bg-cyan-500/10"
    },
    { 
      to: "/admin/kinesiologos", 
      label: "Kinesiólogos", 
      icon: UserCog, 
      color: "text-emerald-400",
      bgHover: "hover:bg-emerald-500/10"
    },
    { 
      to: "/admin/pacientes", 
      label: "Pacientes", 
      icon: Users, 
      color: "text-violet-400",
      bgHover: "hover:bg-violet-500/10"
    },
    { 
      to: "/admin/citas", 
      label: "Citas", 
      icon: Calendar, 
      color: "text-amber-400",
      bgHover: "hover:bg-amber-500/10"
    },
    { 
      to: "/admin/ejercicios", 
      label: "Ejercicios", 
      icon: Dumbbell, 
      color: "text-rose-400",
      bgHover: "hover:bg-rose-500/10"
    },
    { 
      to: "/admin/configuracion", 
      label: "Configuración", 
      icon: Settings, 
      color: "text-slate-400",
      bgHover: "hover:bg-slate-500/10"
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
      {/* Sidebar Admin */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col shadow-2xl">
        {/* Logo Admin */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white tracking-tight">
                RehabControl
              </h1>
              <p className="text-xs text-cyan-400/80 mt-0.5">Panel Admin</p>
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
          <p className="text-xs text-slate-500 uppercase tracking-wider px-4 mb-3">Administración</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/admin" && location.pathname.startsWith(item.to));

            return (
              <Link key={item.to} to={item.to}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20"
                      : `text-slate-300 ${item.bgHover}`
                  }`}
                >
                  <Icon className={`size-5 ${isActive ? "text-white" : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Perfil de usuario Admin */}
        <div className="p-4 border-t border-slate-700/50">
          {loading ? (
            <div className="text-center py-4 text-slate-500">
              Cargando...
            </div>
          ) : currentUser ? (
            <>
              <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-slate-800/50">
                <div className="size-12 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                  {getInitials(currentUser.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">
                    {currentUser.nombre}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-300 rounded-full">
                    Administrador
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