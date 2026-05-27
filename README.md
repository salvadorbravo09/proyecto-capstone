# 🏥 Sistema de Gestión Clínica de Kinesiología

**Proyecto Capstone** - Aplicación web moderna para la administración integral de clínicas de kinesiología

![Status](https://img.shields.io/badge/Status-En%20Desarrollo-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Descripción

Sistema de gestión clínica diseñado para facilitar la administración de clínicas de kinesiología. Permite gestionar usuarios, pacientes, profesionales, citas, fichas clínicas, planes de tratamiento y seguimiento de progreso, todo desde una interfaz intuitiva y moderna.

### ✨ Características principales

- 🔐 **Autenticación segura** - Login con gestión de roles
- 
- 👥 **Gestión de usuarios** - Administración de clínicas, kinesiólogos y pacientes
- 
- 📅 **Sistema de citas** - Agenda integrada de atenciones
- 
- 📋 **Fichas clínicas** - Registros detallados de evaluación
- 
- 🏋️ **Catálogo de ejercicios** - Ejercicios terapéuticos con multimedia
- 
- 📊 **Planes de tratamiento** - Prescripción personalizada por paciente
- 📈 **Seguimiento de progreso** - Monitoreo de evolución del paciente
- 🎨 **Interfaz moderna** - Diseño responsivo con Tailwind CSS y shadcn/ui

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Propósito | Versión |
|-----------|----------|---------|
| **React** | Framework UI | ^19.2.5 |
| **Vite** | Build tool y dev server | ^8.0.10 |
| **React Router DOM** | Enrutamiento | ^7.15.0 |
| **Tailwind CSS** | Estilos CSS | ^4.2.4 |
| **shadcn/ui** | Componentes UI accesibles | ^1.4.3 |
| **Supabase** | Backend y base de datos | ^2.105.3 |
| **Lucide React** | Iconos | ^1.14.0 |

### Base de Datos
- **PostgreSQL** (alojado en Supabase)

### Desarrollo
- **Node.js** (modules type: "module")
- **ESLint** - Validación de código
- **npm** - Gestor de dependencias

## 🚀 Instalación

### Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 o **pnpm**
- Cuenta en **Supabase** (para credenciales de BD)
- **Git** para clonar el repositorio

### 1. Clonar el Repositorio

```bash
git clone https://github.com/salvadorbravo09/proyecto-capstone.git
cd proyecto-capstone
```

### 2. Instalar Dependencias

Accede a la carpeta del frontend:

```bash
cd "Fase 2/Evidencias Proyecto/Evidencias de Sistema Aplicacion/rehabcontrol-web"
```

Instala las dependencias:

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `frontend` con las credenciales de Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

**Dónde obtener las credenciales:**
1. Ve a [Supabase](https://supabase.com/)
2. Selecciona tu proyecto
3. Abre **Settings** → **API**
4. Copia `Project URL` y `anon public key`

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

# 📱 Aplicación Móvil - React Native

Además de la plataforma web, el proyecto cuenta con una aplicación móvil desarrollada en **React Native**, enfocada en facilitar el acceso a información clínica y seguimiento terapéutico desde dispositivos móviles.

La aplicación móvil permitirá:
- Visualización de citas y horarios
- Seguimiento de tratamientos
- Consulta de ejercicios terapéuticos
- Acceso rápido a información del paciente
- Compatibilidad multiplataforma (Android e iOS)

---

## 🛠️ Tecnologías Utilizadas en Mobile

| Tecnología | Propósito |
|-----------|----------|
| **React Native** | Desarrollo móvil multiplataforma |
| **Expo** | Entorno de desarrollo y compilación |
| **Supabase** | Backend y autenticación |
| **React Navigation** | Navegación entre pantallas |

---

## 🚀 Instalación Aplicación Móvil

### Requisitos Previos

- **Node.js** >= 18
- **Expo CLI**
- **Android Studio** o **Expo Go**
- Dispositivo Android/iOS o emulador

### Acceder al Proyecto Mobile

```bash
cd Fase 2/Evidencias Proyecto/Evidencias de Sistema Aplicacion/rehabcontrol-mobile
```

### Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `rehabcontrol-mobile` con las credenciales de Supabase:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### Iniciar la aplicacion movil

```bash
npx expo start
```

Luego:

- Presiona a para abrir Android
- Presiona w para abrir versión web
- Escanea el QR con Expo Go desde tu celular


**Última actualización:** Mayo 2026 | **Versión:** 1.0.0
