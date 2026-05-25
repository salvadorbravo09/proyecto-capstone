const mockPaciente = {
  id: "dd6a739d-1fbb-4375-aead-327a7020db66",
  nombre: "Salvador",
  apellido: "Bravo",
  rut: "20.811.570-7",
  email: "sa.bravo@duoc.cl",
  telefono: "+56 9 8733 6034",
  fecha_nacimiento: "2003-01-09",
  prevision: "FONASA",
  direccion: "Santiago, Chile",
};

const mockHistorial = [
  {
    id: 1,
    fecha: "2026-05-24",
    hora: "09:00",
    motivo: "Control de rodilla",
    kinesiologo: "Diego Mattas",
    notas: "Paciente presenta mejora significativa en la flexión. Se ajustan series de 10 a 12 repeticiones.",
  },
  {
    id: 2,
    fecha: "2026-05-20",
    hora: "11:30",
    motivo: "Sesión de fortalecimiento",
    kinesiologo: "Diego Mattas",
    notas: "Se trabajó cadena cinética cerrada. Dolor controlado. Continuar con rutina actual.",
  },
  {
    id: 3,
    fecha: "2026-05-15",
    hora: "10:00",
    motivo: "Primera evaluación",
    kinesiologo: "Diego Mattas",
    notas: "Evaluación inicial. Rango de movimiento limitado en rodilla derecha (0-90°). Se prescribe rutina de rehabilitación.",
  },
];

const mockRutinaActiva = {
  id: 1,
  fecha_inicio: "2026-05-15",
  ejercicios: [
    {
      id: 1,
      nombre: "Elevación de pierna recta",
      descripcion: "Acostado boca arriba, elevar la pierna extendida 30 cm, mantener 3 segundos y bajar",
      series: 3,
      repeticiones: 12,
      frecuencia_diaria: 2,
      parte_cuerpo: "Pierna",
    },
    {
      id: 2,
      nombre: "Flexión de rodilla asistida",
      descripcion: "Sentado, deslizar el pie hacia atrás flexionando la rodilla con ayuda de una toalla",
      series: 3,
      repeticiones: 10,
      frecuencia_diaria: 3,
      parte_cuerpo: "Rodilla",
    },
    {
      id: 3,
      nombre: "Puente de glúteos",
      descripcion: "Acostado boca arriba con rodillas flexionadas, elevar la cadera hacia arriba",
      series: 3,
      repeticiones: 15,
      frecuencia_diaria: 2,
      parte_cuerpo: "Glúteos",
    },
  ],
};

const mockBiblioteca = [
  { id: 1, nombre: "Elevación de pierna recta", descripcion: "Acostado boca arriba, elevar la pierna extendida", parte_cuerpo: "Pierna", dificultad: "Básico" },
  { id: 2, nombre: "Flexión de rodilla asistida", descripcion: "Sentado, deslizar el pie hacia atrás flexionando la rodilla", parte_cuerpo: "Rodilla", dificultad: "Básico" },
  { id: 3, nombre: "Puente de glúteos", descripcion: "Acostado boca arriba, elevar la cadera", parte_cuerpo: "Glúteos", dificultad: "Básico" },
  { id: 4, nombre: "Sentadilla asistida", descripcion: "Con apoyo de silla, realizar sentadilla controlada", parte_cuerpo: "Pierna", dificultad: "Intermedio" },
  { id: 5, nombre: "Prensa de piernas", descripcion: "En máquina de prensa, extender piernas lentamente", parte_cuerpo: "Pierna", dificultad: "Intermedio" },
  { id: 6, nombre: "Bicicleta estática", descripcion: "Pedaleo suave sin resistencia durante 10 minutos", parte_cuerpo: "Rodilla", dificultad: "Básico" },
  { id: 7, nombre: "Estiramiento de isquiotibiales", descripcion: "Sentado, extender pierna y llevar punta del pie hacia el cuerpo", parte_cuerpo: "Pierna", dificultad: "Básico" },
  { id: 8, nombre: "Equilibrio unipodal", descripcion: "Pararse en una pierna 30 segundos, con apoyo si es necesario", parte_cuerpo: "Pierna", dificultad: "Intermedio" },
  { id: 9, nombre: "Caminata en treadmill", descripcion: "Caminar a ritmo suave durante 15 minutos", parte_cuerpo: "General", dificultad: "Básico" },
  { id: 10, nombre: "Subir escalones", descripcion: "Subir y bajar un escalón de 15 cm de forma controlada", parte_cuerpo: "Pierna", dificultad: "Intermedio" },
];

const mockEvolucion = [
  { semana: "Sem 1 (15-21 May)", cumplimiento: 65, dolor_promedio: 6 },
  { semana: "Sem 2 (22-28 May)", cumplimiento: 80, dolor_promedio: 4 },
  { semana: "Sem 3 (29 May - 4 Jun)", cumplimiento: 88, dolor_promedio: 3 },
  { semana: "Sem 4 (5-11 Jun)", cumplimiento: 92, dolor_promedio: 2 },
];

export { mockPaciente, mockHistorial, mockRutinaActiva, mockBiblioteca, mockEvolucion };
