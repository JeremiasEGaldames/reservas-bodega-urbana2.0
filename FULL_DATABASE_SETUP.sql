-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: usuarios
create table public.usuarios (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  password_hash text not null,
  rol text check (rol in ('recepcion', 'admin')) not null,
  nombre text not null,
  activo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: configuracion
create table public.configuracion (
  clave text primary key,
  valor text not null
);

-- Table: disponibilidad
create table public.disponibilidad (
  id uuid primary key default uuid_generate_v4(),
  fecha date not null,
  horario time without time zone not null,
  idioma text check (idioma in ('es', 'en')) not null,
  disponible boolean default true,
  bloqueada boolean default false,
  motivo_bloqueo text,
  capacidad_maxima integer default 20,
  cupos_cerrados boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(fecha, idioma)
);

-- Table: visitas (Reservas)
create table public.visitas (
  id uuid primary key default uuid_generate_v4(),
  fecha date not null,
  horario time without time zone not null,
  idioma text check (idioma in ('es', 'en')) not null,
  nombre text not null,
  apellido text not null,
  hotel text check (hotel in ('Sheraton', 'Huentala', 'Hualta', 'Externo')) not null,
  email text,
  telefono text,
  cantidad_huespedes integer not null default 1,
  estado text check (estado in ('pendiente', 'confirmada', 'cancelada')) default 'pendiente',
  notas text,
  created_by uuid references public.usuarios(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.usuarios enable row level security;
alter table public.configuracion enable row level security;
alter table public.disponibilidad enable row level security;
alter table public.visitas enable row level security;

-- Policies (Simplified for initial setup, refine as needed)
-- Usuarios: only visible to themselves or admins (logic in app)
create policy "Allow read access to all users" on public.usuarios for select using (true);
create policy "Allow insert for registration" on public.usuarios for insert with check (true);
create policy "Allow update for admins" on public.usuarios for update using (true);

-- Configuracion: public read, admin write
create policy "Allow public read access" on public.configuracion for select using (true);
create policy "Allow admin update" on public.configuracion for all using (true);

-- Disponibilidad: public read, admin write
create policy "Allow public read access" on public.disponibilidad for select using (true);
create policy "Allow admin write access" on public.disponibilidad for all using (true);

-- Visitas: public insert (for reception), read all (for admin/reception)
create policy "Allow public insert" on public.visitas for insert with check (true);
create policy "Allow authenticated read" on public.visitas for select using (true);
-- Added anon policies (since custom auth is used)
create policy "anon_read_visitas" on public.visitas for select using (true);
create policy "anon_update_visitas" on public.visitas for update using (true);
create policy "anon_delete_visitas" on public.visitas for delete using (true);

-- Initial Data
insert into public.configuracion (clave, valor) values
('horario_es', '19:00'),
('horario_en', '19:30'),
('capacidad_default_es', '20'),
('capacidad_default_en', '20'),
('idiomas_activos', 'es,en');

-- Add initial Admin user (password: admin123) - hashed with bcrypt
-- Note: In a real scenario, use the app registration to create the first user to ensure correct hashing.
-- This SQL script provides structure primarily.

-- Added validation triggers for security
-- Función que valida antes de insertar una visita
CREATE OR REPLACE FUNCTION validar_reserva_permitida()
RETURNS TRIGGER AS $$
DECLARE
  v_turno disponibilidad%ROWTYPE;
  v_huespedes_actuales INT;
BEGIN
  -- Buscar el turno correspondiente
  SELECT * INTO v_turno
  FROM disponibilidad
  WHERE fecha = NEW.fecha
    AND idioma = NEW.idioma;

  -- Si no existe el turno, rechazar
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'El turno solicitado no existe.';
  END IF;

  -- Si está bloqueado, rechazar
  IF v_turno.bloqueada THEN
    RAISE EXCEPTION
      'Este día está bloqueado: %',
      COALESCE(v_turno.motivo_bloqueo,
        'Sin motivo especificado');
  END IF;

  -- Si los cupos están cerrados, rechazar
  IF v_turno.cupos_cerrados THEN
    RAISE EXCEPTION
      'Los cupos de este turno están cerrados.';
  END IF;

  -- Si no está disponible, rechazar
  IF NOT v_turno.disponible THEN
    RAISE EXCEPTION
      'Este turno no está disponible.';
  END IF;

  -- Contar huéspedes actuales del turno
  SELECT COALESCE(SUM(cantidad_huespedes), 0)
  INTO v_huespedes_actuales
  FROM visitas
  WHERE fecha = NEW.fecha
    AND idioma = NEW.idioma
    AND estado != 'cancelada';

  -- Verificar si hay cupos suficientes
  IF (v_huespedes_actuales + NEW.cantidad_huespedes)
      > v_turno.capacidad_maxima THEN
    RAISE EXCEPTION
      'No hay suficientes cupos. Disponibles: %, Solicitados: %',
      (v_turno.capacidad_maxima - v_huespedes_actuales),
      NEW.cantidad_huespedes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger en la tabla visitas
DROP TRIGGER IF EXISTS
  trigger_validar_reserva ON visitas;

CREATE TRIGGER trigger_validar_reserva
  BEFORE INSERT ON visitas
  FOR EACH ROW
  EXECUTE FUNCTION validar_reserva_permitida();
