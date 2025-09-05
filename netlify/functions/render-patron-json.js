// netlify/functions/render-patron-json.js
exports.handler = async (event) => {
  try {
    const isPost = event.httpMethod === "POST";
    const data = isPost ? JSON.parse(event.body || "{}")
                        : (event.queryStringParameters || {});

    const titulo     = data.titulo   || "Patrón de ejemplo";
    const nivel      = data.nivel    || "Principiante";
    const tension    = data.tension  || "";
    const materiales = Array.isArray(data.materiales) ? data.materiales
      : (typeof data.materiales === "string" && data.materiales ? data.materiales.split("|") : ["Hilo","Aguja","Tijeras"]);
    const pasos      = Array.isArray(data.pasos) ? data.pasos
      : (typeof data.pasos === "string" && data.pasos ? data.pasos.split("|") : ["Paso 1","Paso 2","Paso 3"]);
    const consejos   = Array.isArray(data.consejos) ? data.consejos
      : (typeof data.consejos === "string" && data.consejos ? data.consejos.split("|") : []);
    const variantes  = Array.isArray(data.variantes) ? data.variantes
      : (typeof data.variantes === "string" && data.variantes ? data.variantes.split("|") : []);

    // Construimos una ruta al SVG (imagen del patrón) lista para incrustar en el chat
    const enc = encodeURIComponent;
    const svgPath =
      `/.netlify/functions/patron-svg?` +
      `titulo=${enc(titulo)}` +
      `&nivel=${enc(nivel)}` +
      `&tension=${enc(tension)}` +
      `&materiales=${enc(materiales.join("|"))}` +
      `&pasos=${enc(pasos.join("|"))}`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        ok: true,
        fecha: new Date().toISOString(),
        patron: { titulo, nivel, tension, materiales, pasos, consejos, variantes },
        links: {
          svg: svgPath,                            // imagen del patrón para el chat
          pdf: "/.netlify/functions/generar-pdf"   // descarga opcional
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
