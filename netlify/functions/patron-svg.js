// netlify/functions/patron-svg.js
function esc(s=""){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

exports.handler = async (event) => {
  try {
    const q = event.queryStringParameters || {};
    // Admitimos POST JSON también, pero para <img> en el chat es mejor GET con query
    let data = q;
    if (event.httpMethod === "POST" && event.body) {
      data = { ...(q||{}), ...JSON.parse(event.body || "{}") };
    }

    const titulo     = data.titulo   || "Patrón de ejemplo";
    const nivel      = data.nivel    || "Principiante";
    const tension    = data.tension  || "";
    const materiales = Array.isArray(data.materiales) ? data.materiales
                      : (data.materiales ? String(data.materiales).split("|") : ["Hilo","Aguja","Tijeras"]);
    const pasos      = Array.isArray(data.pasos) ? data.pasos
                      : (data.pasos ? String(data.pasos).split("|") : ["Paso 1","Paso 2","Paso 3"]);

    // Layout simple (sin dependencias nativas): ancho fijo, alto según contenido
    const W = parseInt(data.w || data.width || "900", 10);
    const pad = 24, lh = 22;
    let y = pad + 16;

    const lines = [];
    const pushText = (txt, opts = {}) => {
      lines.push({ type: "text", y, txt, ...opts }); y += lh;
    };
    const pushGap = (h=lh/2) => { y += h; };
    const pushH1  = (txt) => { lines.push({ type: "h1", y, txt }); y += lh + 6; };

    // Título
    pushText(titulo, { align: "center", size: 26, weight: "700" });
    if (nivel)   pushText(`Nivel: ${nivel}`,   { align: "center", size: 14, color: "#444" });
    if (tension) pushText(`Tensión/Muestra: ${tension}`, { align: "center", size: 12, color: "#666" });
    pushGap(lh);

    // Materiales
    pushH1("Materiales");
    materiales.forEach(m => pushText(`• ${m}`, { size: 13 }));

    pushGap(lh/2);
    // Pasos
    pushH1("Pasos");
    pasos.forEach((p,i) => pushText(`${i+1}) ${p}`, { size: 13 }));

    // Pie
    pushGap(lh);
    const fecha = new Date().toLocaleDateString("es-ES");
    pushText(`Generado por Club IA de Manualidades — ${fecha}`, { align: "right", size: 10, color: "#777" });

    const H = y + pad;

    // Generamos SVG
    const header = `<?xml version="1.0" encoding="UTF-8"?>`;
    const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <style>
        .card{ fill:#fff; stroke:#e5e7eb; stroke-width:1; }
        .ttl{ font: 700 26px system-ui, -apple-system, Segoe UI, Roboto, Arial; fill:#111; }
        .h1 { font: 700 16px system-ui, -apple-system, Segoe UI, Roboto, Arial; fill:#111; }
        .txt{ font: 400 13px system-ui, -apple-system, Segoe UI, Roboto, Arial; fill:#111; }
        .mut{ fill:#666; font: 400 12px system-ui, -apple-system, Segoe UI, Roboto, Arial; }
        .mut2{ fill:#444; font: 400 14px system-ui, -apple-system, Segoe UI, Roboto, Arial; }
      </style>
      <rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc"/>
      <rect x="${pad/2}" y="${pad/2}" width="${W-pad}" height="${H-pad}" rx="16" class="card"/>
    `;

    const centeredX = W/2;
    const textEls = lines.map(l => {
      const x = l.align === "center" ? centeredX
              : l.align === "right" ? (W - pad*1.5)
              : pad*1.5;
      const cls = l.type === "h1" ? "h1" : (l.size === 26 ? "ttl" : "txt");
      const fill = l.color || (cls === "txt" ? "#111" : "#111");
      const weight = l.weight || "normal";
      const size = l.size || (l.type === "h1" ? 16 : 13);
      const anchor = l.align === "center" ? 'text-anchor="middle"'
                   : l.align === "right" ? 'text-anchor="end"'
                   : '';
      return `<text x="${x}" y="${l.y}" ${anchor} fill="${fill}" style="font-weight:${weight}; font-size:${size}px;">${esc(l.txt)}</text>`;
    }).join("\n");

    const svg = `${header}${svgOpen}${textEls}\n</svg>`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      },
      body: svg
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: `Error: ${err.message}`
    };
  }
};
