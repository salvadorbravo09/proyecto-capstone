import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Pacientes from "./pages/Pacientes";
import Notificaciones from "./pages/Notificaciones";
import PacienteFicha from "./pages/PacienteFicha";
import AdminDashboard from "./pages/AdminDashboard";
import AdminKinesiologos from "./pages/AdminKinesiologos";
import AdminPacientes from "./pages/AdminPacientes";
import AdminCitas from "./pages/AdminCitas";

export const router = createBrowserRouter([
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "agenda",
        Component: Agenda,
      },
      {
        path: "pacientes",
        Component: Pacientes,
      },
      {
        path: "notificaciones",
        Component: Notificaciones,
      },
      {
        path: "pacientes/:id/ficha",
        Component: PacienteFicha,
      },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      {
        index: true,
        Component: AdminDashboard,
      },
      {
        path: "kinesiologos",
        Component: AdminKinesiologos,
      },
      {
        path: "pacientes",
        Component: AdminPacientes,
      },
      {
        path: "citas",
        Component: AdminCitas,
      },
      {
        path: "configuracion",
        element: <div className="p-8"><h1>Configuración</h1></div>,
      },
    ],
  },
]);