import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
import { format, parseISO, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

function safeFormatDate(value, fmt) {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? parseISO(value) : new Date(value);
    if (isNaN(d.getTime())) return "-";
    return format(d, fmt, { locale: es });
  } catch {
    return "-";
  }
}

export async function generarPdfFicha(pacienteId) {
  const pacResp = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", pacienteId)
    .single();

  if (pacResp.error) {
    console.error("Error fetching paciente:", pacResp.error);
    throw pacResp.error;
  }
  if (!pacResp.data) throw new Error("Paciente no encontrado");

  const pac = pacResp.data;

  let previsionNombre = "Sin previsión";
  if (pac.prevision_id) {
    const prevResp = await supabase
      .from("previsiones")
      .select("nombre")
      .eq("id", pac.prevision_id)
      .maybeSingle();
    if (prevResp.data) previsionNombre = prevResp.data.nombre;
  }

  let kinesiologoNombre = null;
  if (pac.kinesiologo_asignado_id) {
    const kinResp = await supabase
      .from("kinesiologos")
      .select("nombre, apellido")
      .eq("id", pac.kinesiologo_asignado_id)
      .maybeSingle();
    if (kinResp.data) {
      kinesiologoNombre = [kinResp.data.nombre, kinResp.data.apellido]
        .filter(Boolean)
        .join(" ");
    }
  }

  let fichas = null;
  const fichasResp = await supabase
    .from("fichas")
    .select("*")
    .eq("paciente_id", pacienteId)
    .is("fecha_cierre", null)
    .maybeSingle();
  if (fichasResp.error) {
    console.error("Error fetching fichas:", fichasResp.error);
  } else {
    fichas = fichasResp.data;
  }

  let planData = null;
  const planResp = await supabase
    .from("planes_tratamiento")
    .select(
      `id, fecha_inicio, plan_detalle(id, series, repeticiones, frecuencia_diaria, ejercicio:ejercicios(id, nombre, parte_cuerpo))`,
    )
    .eq("paciente_id", pacienteId)
    .is("fecha_fin", null)
    .maybeSingle();
  if (planResp.error) {
    console.error("Error fetching plan:", planResp.error);
  } else {
    planData = planResp.data;
  }

  let citasData = [];
  const citasResp = await supabase
    .from("citas")
    .select(
      `id, fecha, hora, motivo_consulta, estados(nombre), kinesiologos(nombre, apellido)`,
    )
    .eq("paciente_id", pacienteId)
    .order("fecha", { ascending: false })
    .limit(20);
  if (citasResp.error) {
    console.error("Error fetching citas:", citasResp.error);
  } else {
    citasData = citasResp.data || [];
  }

  const pacienteNombre =
    pac.nombre_completo ||
    [pac.nombre, pac.apellido].filter(Boolean).join(" ").trim() ||
    "Sin nombre";

  const ejercicios = planData?.plan_detalle || [];

  let evolucionData = [];
  if (planData && ejercicios.length > 0) {
    const detalleIds = ejercicios.map((e) => e.id);
    const cuatroSemanasAtras = subWeeks(new Date(), 4).toISOString();
    const progResp = await supabase
      .from("seguimiento_progreso")
      .select("fecha_registro, completado, nivel_dolor")
      .in("plan_detalle_id", detalleIds)
      .gte("fecha_registro", cuatroSemanasAtras);

    if (progResp.error) {
      console.error("Error fetching progreso:", progResp.error);
    } else if (progResp.data && progResp.data.length > 0) {
      const weekMap = new Map();
      for (const p of progResp.data) {
        const ws = startOfWeek(new Date(p.fecha_registro), { weekStartsOn: 1 });
        const key = ws.toISOString().split("T")[0];
        if (!weekMap.has(key))
          weekMap.set(key, { ws, total: 0, completados: 0, dolorSum: 0, dolorCount: 0 });
        const w = weekMap.get(key);
        w.total++;
        if (p.completado) w.completados++;
        if (p.nivel_dolor != null) {
          w.dolorSum += p.nivel_dolor;
          w.dolorCount++;
        }
      }

      evolucionData = [...weekMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([_, w], idx) => {
          const we = endOfWeek(w.ws, { weekStartsOn: 1 });
          return {
            semana: `Sem ${idx + 1} (${format(w.ws, "d MMM", { locale: es })}-${format(we, "d MMM", { locale: es })})`,
            cumplimiento: `${Math.round((w.completados / w.total) * 100)}%`,
            dolor:
              w.dolorCount > 0
                ? `${Math.round((w.dolorSum / w.dolorCount) * 10) / 10}/10`
                : "--",
          };
        });
    }
  }

  const citas = citasData.map((c) => ({
    fecha: safeFormatDate(c.fecha, "dd MMM yyyy"),
    hora: c.hora?.slice(0, 5) || "-",
    motivo: c.motivo_consulta || "Sin motivo",
    kinesiologo:
      [c.kinesiologos?.nombre, c.kinesiologos?.apellido].filter(Boolean).join(" ") || "-",
    estado: c.estados?.nombre || "-",
  }));

  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;

  const addSection = (title, yPos) => {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, yPos);
    doc.setDrawColor(43, 108, 176);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, pw - 20, yPos + 2);
    return yPos + 10;
  };

  const addField = (label, value, yPos) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(String(value ?? "-"), 20 + (label.length > 15 ? 50 : 40), yPos);
    return yPos + 6;
  };

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(43, 108, 176);
  doc.text("FICHA CLÍNICA", 20, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("RehabControl", pw - 20, y, { align: "right" });
  y += 8;
  doc.setFontSize(8);
  doc.text(`Exportado el ${format(new Date(), "dd MMM yyyy", { locale: es })}`, 20, y);
  y += 12;

  doc.setTextColor(0);
  y = addSection("1. Datos del Paciente", y);
  y = addField("Nombre", pacienteNombre, y);
  y = addField("RUT", pac.rut, y);
  y = addField("Email", pac.email, y);
  y = addField("Teléfono", pac.telefono, y);
  if (pac.fecha_nacimiento)
    y = addField("Fecha Nac.", safeFormatDate(pac.fecha_nacimiento, "dd MMM yyyy"), y);
  y = addField("Previsión", previsionNombre, y);
  y += 4;

  y = addSection("2. Kinesiólogo Asignado", y);
  y = addField("Nombre", kinesiologoNombre || "Sin asignar", y);
  y += 4;

  if (fichas) {
    y = addSection("3. Ficha de Tratamiento", y);
    y = addField("Motivo", fichas.motivo_tratamiento || "No registrado", y);
    y = addField("Fecha inicio", safeFormatDate(fichas.fecha_inicio, "dd MMM yyyy"), y);
    y = addField("Estado", fichas.fecha_cierre ? "Cerrada" : "Activa", y);
    y += 4;
  }

  y = addSection("4. Rutina Activa", y);
  if (ejercicios.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["#", "Ejercicio", "Series", "Repeticiones", "Frecuencia"]],
      body: ejercicios.map((ej, i) => [
        i + 1,
        ej.ejercicio?.nombre || "Ejercicio",
        ej.series,
        ej.repeticiones,
        `${ej.frecuencia_diaria}x/día`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [43, 108, 176], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Sin ejercicios asignados", 20, y);
    y += 10;
    doc.setTextColor(0);
  }

  if (y > 230) { doc.addPage(); y = 20; }
  y = addSection("5. Historial de Sesiones", y);

  if (citas.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Hora", "Motivo", "Kinesiólogo", "Estado"]],
      body: citas.slice(0, 15).map((c) => [
        c.fecha,
        c.hora,
        c.motivo.length > 25 ? c.motivo.slice(0, 25) + "..." : c.motivo,
        c.kinesiologo,
        c.estado.charAt(0).toUpperCase() + c.estado.slice(1),
      ]),
      theme: "grid",
      headStyles: { fillColor: [43, 108, 176], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Sin sesiones registradas", 20, y);
    y += 10;
    doc.setTextColor(0);
  }

  if (y > 230) { doc.addPage(); y = 20; }
  y = addSection("6. Evolución (últimas 4 semanas)", y);

  if (evolucionData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Semana", "Cumplimiento", "Dolor Promedio"]],
      body: evolucionData.map((e) => [e.semana, e.cumplimiento, e.dolor]),
      theme: "grid",
      headStyles: { fillColor: [43, 108, 176], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 20, right: 20 },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text("Sin datos de evolución en las últimas 4 semanas", 20, y);
  }

  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}
