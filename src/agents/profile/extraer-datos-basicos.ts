import type { DatosPerfil } from "./types/profile.schema";

const PALABRAS_SECCION = [
  "experiencia",
  "educacion",
  "educación",
  "formacion",
  "formación",
  "habilidades",
  "skills",
  "perfil",
  "resumen",
  "objetivo",
  "contacto",
  "referencias",
];

function limpiarTexto(texto: string): string {
  return texto
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function normalizarLinea(linea: string): string {
  return limpiarTexto(linea).replace(/\s+/g, " ");
}

function esLineaDeSeccion(linea: string): boolean {
  const texto = linea.toLowerCase();
  return PALABRAS_SECCION.some((palabra) => texto.includes(palabra));
}

function extraerCorreo(texto: string): string | undefined {
  const coincidencia = texto.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return coincidencia?.[0];
}

function extraerTelefono(texto: string): string | undefined {
  const coincidencia = texto.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/);
  return coincidencia?.[0]?.trim();
}

function extraerNombreDesdeTexto(texto: string, lineas: string[]): string | undefined {
  const patrones = [
    /(?:nombre(?:s)?|name)\s*[:\-]\s*(.+)/i,
    /(?:hoja de vida de|cv de|curriculum de)\s*[:\-]?\s*(.+)/i,
    /(?:candidato(?:a)?|persona)\s*[:\-]\s*(.+)/i,
  ];

  for (const patron of patrones) {
    const coincidencia = texto.match(patron);
    if (coincidencia?.[1]) {
      return normalizarLinea(coincidencia[1]);
    }
  }

  for (const linea of lineas) {
    const limpia = normalizarLinea(linea);
    if (!limpia) {
      continue;
    }

    const minuscula = limpia.toLowerCase();
    if (limpia.includes("@") || limpia.includes(":")) {
      continue;
    }

    if (esLineaDeSeccion(minuscula)) {
      continue;
    }

    const palabras = limpia.split(" ").filter(Boolean);
    const pareceNombre = palabras.length >= 2 && palabras.length <= 5;
    const tieneSoloLetrasBasicas = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'´`-]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'´`-]+)*$/.test(limpia);

    if (pareceNombre && tieneSoloLetrasBasicas) {
      return limpia;
    }
  }

  return undefined;
}

function extraerHabilidades(texto: string): string[] {
  const habilidadesConocidas = [
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node.js",
    "node",
    "python",
    "java",
    "c#",
    "sql",
    "mysql",
    "postgresql",
    "html",
    "css",
    "git",
    "docker",
  ];

  const textoMinuscula = texto.toLowerCase();
  const habilidades = habilidadesConocidas.filter((habilidad) =>
    textoMinuscula.includes(habilidad)
  );

  return Array.from(new Set(habilidades));
}

function extraerExperienciaBasica(lineas: string[]): DatosPerfil["experiencia"] {
  const experiencia: DatosPerfil["experiencia"] = [];
  const patronRol = /(desarrollador|developer|ingenier|analista|practicante|coordinador|lider|lead|manager|consultor)/i;
  const patronFecha = /(19|20)\d{2}|actual|presente|\baños?\b|\bmes(es)?\b/i;

  for (const linea of lineas) {
    const limpia = normalizarLinea(linea);
    if (!limpia) {
      continue;
    }

    const esTituloExperiencia = /^(experiencia|experiencia laboral|proyectos)/i.test(limpia);
    if (esTituloExperiencia) {
      continue;
    }

    const pareceExperiencia = patronRol.test(limpia) || patronFecha.test(limpia);
    if (!pareceExperiencia) {
      continue;
    }

    const [cargoRaw, empresaRaw] = limpia.split(/\s+-\s+|\sen\s/i);
    experiencia.push({
      cargo: normalizarLinea(cargoRaw || limpia),
      empresa: normalizarLinea(empresaRaw || "No especificada"),
      descripcion: limpia,
    });

    if (experiencia.length >= 3) {
      break;
    }
  }

  return experiencia;
}

function extraerEducacionBasica(lineas: string[]): DatosPerfil["educacion"] {
  const educacion: DatosPerfil["educacion"] = [];
  const patronEducacion = /(universidad|instituto|tecnolog|ingenier|licenciatura|maestr|doctorado|bachiller|educacion|educación|formacion|formación)/i;

  for (const linea of lineas) {
    const limpia = normalizarLinea(linea);
    if (!limpia) {
      continue;
    }

    const esTituloEducacion = /^(educacion|educación|formacion|formación académica)/i.test(limpia);
    if (esTituloEducacion) {
      continue;
    }

    if (!patronEducacion.test(limpia)) {
      continue;
    }

    const [tituloRaw, institucionRaw] = limpia.split(/\s+-\s+|\sen\s/i);
    educacion.push({
      titulo: normalizarLinea(tituloRaw || "Formación detectada"),
      institucion: normalizarLinea(institucionRaw || "No especificada"),
    });

    if (educacion.length >= 3) {
      break;
    }
  }

  return educacion;
}

export function extraerDatosBasicosDesdeTexto(textoOriginal: string): Partial<DatosPerfil> {
  const texto = limpiarTexto(textoOriginal);
  const lineas = texto
    .split("\n")
    .map(normalizarLinea)
    .filter(Boolean);

  const experiencia = extraerExperienciaBasica(lineas);
  const educacion = extraerEducacionBasica(lineas);

  return {
    nombre: extraerNombreDesdeTexto(texto, lineas),
    correo: extraerCorreo(texto),
    telefono: extraerTelefono(texto),
    habilidades: extraerHabilidades(texto),
    idiomas: [],
    enlaces: [],
    experiencia,
    educacion,
  };
}
