# Huentala Wines Bodega Urbana - App de Reservas

Este proyecto es una aplicación de gestión de reservas para Huentala Wines Bodega Urbana. Permite a los recepcionistas y administradores gestionar visitas, disponibilidad y análisis de datos en tiempo real.

## Características

-   **Panel de Recepción**: Interfaz ágil para crear reservas y ver disponibilidad del día.
-   **Panel de Administración**: Gestión completa del sistema, configuración, usuarios y dashboard de análisis.
-   **Diseño Responsive**: Compatible con dispositivos móviles, tablets y escritorio.
-   **Tiempo Real**: Todas las reservas y cambios en la disponibilidad se actualizan instantáneamente en todas las sesiones.
-   **Seguridad**: Autenticación basada en roles (Recepción / Admin) y políticas de seguridad a nivel de fila (RLS) en la base de datos.
-   **Internacionalización**: Soporte para reservas en Español e Inglés con horarios dedicados.

## Tecnologías

-   **Frontend**: Next.js 14 (App Router)
-   **Lenguaje**: TypeScript
-   **Estilos**: Tailwind CSS (Sistema de Diseño Stitch)
-   **Base de Datos y Auth**: Supabase (PostgreSQL + Auth + Realtime)
-   **Gráficos**: Recharts
-   **Despliegue**: Vercel

## Instalación Local

1.  Clonar el repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd reservas-bodega-urbana2.0
    ```

2.  Instalar dependencias:
    ```bash
    npm install
    ```

3.  Configurar variables de entorno:
    Crear un archivo `.env.local` en la raíz del proyecto basado en `.env.example`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
    ```
    *Nota: Asegúrate de habilitar Realtime en tu panel de Supabase para las tablas `disponibilidad` y `visitas`.*

4.  Ejecutar el servidor de desarrollo:
    ```bash
    npm run dev
    ```
    Abre `http://localhost:3000` en tu navegador.

## Despliegue en Vercel

1.  Subir el código a un repositorio de GitHub.
2.  Importar el proyecto en Vercel.
3.  En la configuración del proyecto en Vercel, añadir las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4.  Desplegar.

## Configuración de Base de Datos

Si estás configurando una base de datos nueva en Supabase, ejecuta el script `FULL_DATABASE_SETUP.sql` en el Editor SQL de tu panel de Supabase. Esto creará todas las tablas y políticas de seguridad necesarias.

Recuerda crear el primer usuario administrador para poder acceder al panel. Puedes hacerlo manualmente en la tabla `usuarios` o utilizar la API de registro temporalmente (consulta `app/api/auth/register/route.ts`).
