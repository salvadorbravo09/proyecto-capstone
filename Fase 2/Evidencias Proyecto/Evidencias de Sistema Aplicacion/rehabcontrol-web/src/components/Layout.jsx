import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { getUserRole, isAllowedRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Layout() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!active) {
        return;
      }

      if (!session) {
        setStatus("blocked");
        return;
      }

      try {
        const role = await getUserRole(session.user.id);

        if (role && isAllowedRole(role)) {
          setStatus("allowed");
          return;
        }

        await supabase.auth.signOut();
        setStatus("blocked");
      } catch {
        await supabase.auth.signOut();
        setStatus("blocked");
      }
    }

    checkAccess();

    const { data } = supabase.auth.onAuthStateChange(async (event) => {
      if (!active) {
        return;
      }

      if (event === "SIGNED_OUT") {
        setStatus("blocked");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setStatus("blocked");
        return;
      }

      try {
        const role = await getUserRole(session.user.id);
        setStatus(role && isAllowedRole(role) ? "allowed" : "blocked");
      } catch {
        setStatus("blocked");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Verificando acceso...
      </div>
    );
  }

  if (status === "blocked") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
