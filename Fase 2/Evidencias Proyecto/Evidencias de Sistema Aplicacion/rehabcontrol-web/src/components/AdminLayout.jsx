import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Home, Users, Calendar, UserCog, Settings, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    { to: "/admin", label: "Dashboard", icon: Home },
    { to: "/admin/kinesiologos", label: "Kinesiólogos", icon: UserCog },
    { to: "/admin/pacientes", label: "Pacientes", icon: Users },
    { to: "/admin/citas", label: "Citas", icon: Calendar },
    { to: "/admin/configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="font-semibold text-xl text-sidebar-primary">
            RehabControl
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Panel Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/admin" && location.pathname.startsWith(item.to));

            return (
              <Link key={item.to} to={item.to}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Cargando...
            </div>
          ) : currentUser ? (
            <>
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="size-10 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-semibold">
                  {currentUser.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {currentUser.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Administrador
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Sin sesión
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}