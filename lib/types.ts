// ========================
// Database Types
// ========================

export type RolUsuario = 'recepcion' | 'admin';
export type IdiomaType = 'es' | 'en' | 'pt';
export type HotelType = 'Sheraton' | 'Huentala' | 'Hualta' | 'Externo';
export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada';

export interface Usuario {
    id: string;
    email: string;
    password_hash: string;
    rol: RolUsuario;
    nombre: string;
    activo: boolean;
    created_at?: string;
}

export interface Disponibilidad {
    id: string;
    fecha: string;
    horario: string;
    idioma: IdiomaType;
    disponible: boolean;
    bloqueada: boolean;
    motivo_bloqueo: string | null;
    capacidad_maxima: number;
    cupos_cerrados: boolean;
    created_at?: string;
}

export interface Visita {
    id: string;
    fecha: string;
    horario: string;
    idioma: IdiomaType;
    nombre: string;
    apellido: string;
    hotel: HotelType;
    email: string | null;
    telefono: string | null;
    cantidad_huespedes: number;
    estado: EstadoReserva;
    notas: string | null;
    created_by: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Configuracion {
    clave: string;
    valor: string;
}

export interface AnalyticsCache {
    fecha: string;
    total_reservas: number;
    reservas_es: number;
    reservas_en: number;
    promedio_huespedes: number;
    updated_at?: string;
}

// ========================
// UI Types
// ========================

export interface DayStatus {
    fecha: string;
    turnos: TurnoStatus[];
}

export interface TurnoStatus {
    id: string;
    horario: string;
    idioma: IdiomaType;
    disponible: boolean;
    bloqueada: boolean;
    cupos_cerrados: boolean;
    capacidad_maxima: number;
    reservas_count: number;
    cupos_disponibles: number;
    motivo_bloqueo?: string | null;
}

export interface ReservaFormData {
    nombre: string;
    apellido: string;
    hotel: HotelType;
    email: string;
    telefono: string;
    cantidad_huespedes: number;
    idioma: IdiomaType;
    notas: string;
}

export interface AnalyticsData {
    totalReservas: number;
    reservasEs: number;
    reservasEn: number;
    promedioDiario: number;
    promedioDiarioEs: number;
    promedioDiarioEn: number;
    promedioHuespedes: number;
    porHotel: { hotel: string; count: number }[];
    tendenciaSemanal: { semana: string; total: number; es: number; en: number }[];
    topFechas: { fecha: string; total: number }[];
}

export interface AuthState {
    user: Usuario | null;
    loading: boolean;
}
