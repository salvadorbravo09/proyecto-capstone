export function cleanRut(value) {
  if (!value) return "";
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function formatRut(value) {
  const clean = cleanRut(value);
  if (!clean) return "";

  let body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  body = body.replace(/^0+/, "");
  body = body.padStart(1, "0");

  let formatted = "";
  while (body.length > 3) {
    formatted = "." + body.slice(-3) + formatted;
    body = body.slice(0, -3);
  }
  formatted = body + formatted + "-" + dv;

  return formatted;
}

export function unformatRut(value) {
  return cleanRut(value);
}

export function validateRut(rut) {
  const clean = cleanRut(rut);
  if (!clean) return { valid: false, message: "El RUT es obligatorio." };

  if (clean.length < 3) return { valid: false, message: "RUT demasiado corto." };
  if (clean.length > 9) return { valid: false, message: "RUT demasiado largo." };

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  let expectedDvStr;
  if (expectedDv === 11) expectedDvStr = "0";
  else if (expectedDv === 10) expectedDvStr = "K";
  else expectedDvStr = String(expectedDv);

  if (dv !== expectedDvStr) {
    return { valid: false, message: "El dígito verificador no es válido." };
  }

  return { valid: true, message: "" };
}
