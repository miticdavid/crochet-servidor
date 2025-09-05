// netlify/functions/patron-universal.js
// MVP: JSON (por defecto) o SVG (format=svg)
// Familias activas: circular (gorro/posavasos/puntera/base) y lineal (bufanda)
// Símbolos estándar en marrón oscuro (#5A3D2B). En lineal se fuerza pb.

/* =============== Helpers =============== */
function enc(s){ return encodeURIComponent(String(s)); }
function round(n){ return Math.round(Number(n)); }
function num(v, def){ const n = Number(v); return Number.isFinite(n) ? n : def; }
function bool(v, def=false){ if(v===undefined) return def; return String(v)==="1"||String(v).toLowerCase()==="true"; }

function parseInput(event){
  const isPost = event.httpMethod === "POST";
  const q = event.queryStringParameters || {};
  const body = isPost && event.body ? JSON.parse(event.body) : {};
  const in_ = { ...q, ...body };

  const categoria = (in_.categoria || "gorro").toLowerCase().trim();
  const punto = "pb"; // MVP: forzamos pb en diagrams para consistencia visual
  const layout = (in_.layout || in_.diagram || in_.diagrama || "").toLowerCase(); // circular|lineal|""(auto)
  const format = (in_.format || "json").toLowerCase(); // json|svg

  // Tensión
  const puntos10 = num(in_.puntos_10cm ?? in_.puntos10 ?? in_.puntos, 18);
  const vueltas10 = num(in_.vueltas_10cm ?? in_.vueltas10 ?? in_.vueltas, 20);

  // Medidas
  const medidas = {};
  medidas.ease = (in_.ease!==undefined) ? Number(in_.ease) : undefined;
  medidas.contorno_cm  = num(in_.contorno_cm, undefined);
  medidas.diametro_cm  = num(in_.diametro_cm, undefined);
  medidas.ancho_cm     = num(in_.ancho_cm, undefined);
  medidas.largo_cm     = num(in_.largo_cm, undefined);

  return { categoria, punto, layout, format, puntos10, vueltas10, medidas, q };
}

/* =============== Heurísticas =============== */
function incPorVuelta(){ return 6; } // pb → 6 aumentos por vuelta
function pasosCircular(inicio, V){
  const pasos = [];
  pasos.push(`V1: ${inicio} pb en anillo`);
  if (V >= 2) pasos.push(`V2: aumentos en cada punto → ${inicio*2} pts`);
  for (let v = 3; v <= V; v++){
    const sep = v - 2;
    pasos.push(`V${v}: *${sep} pb, 1 aum* × ${inicio} → ${inicio*v} pts`);
  }
  return pasos;
}

/* =============== Generadores (texto) =============== */
function genCircularBase({tipo, tituloBase, puntos10, vueltas10, medidas, r0=40, dr=22}){
  const inicio = 6;
  const inc = incPorVuelta();
  const ptsPorCm = puntos10 / 10;
  const vtsPorCm = vueltas10 / 10;

  let titulo = tituloBase || "Proyecto circular";
  let materiales = [];
  let pasos = [];
  let vueltas = 8;

  if (tipo === "gorro") {
    const contorno = num(medidas.contorno_cm, 56);
    const ease = medidas.ease ?? -0.1;
    const contornoObjetivo = contorno * (1 + ease);
    const puntosObjetivo = round(contornoObjetivo * ptsPorCm);
    vueltas = Math.max(3, Math.round(puntosObjetivo / inc));

    const diametroCopa_cm = contornoObjetivo / Math.PI;
    const altoCuerpo_cm = Math.max(6, Math.round(diametroCopa_cm * 0.6));
    const filasCuerpo = round(altoCuerpo_cm * vtsPorCm);

    titulo = `Gorro básico (${Math.round(contorno)} cm)`;
    materiales = [
      `Algodón (cat. 4) ~${Math.max(80, Math.round(contornoObjetivo*3))} m`,
      `Aguja ${(puntos10>=20)?4:5} mm (ajusta según tensión)`,
      `Marcadores · Tijeras · Aguja lanera`
    ];
    pasos = [
      ...pasosCircular(inicio, vueltas),
      `Cuerpo: recto en pb ~${filasCuerpo} vueltas (${altoCuerpo_cm} cm aprox.)`,
      `Borde: cangrejo o elástico; rematar y esconder hebras`
    ];
  }
  else if (tipo === "posavasos") {
    const diam = Math.max(6, num(medidas.diametro_cm, 10));
    const circ = Math.PI * diam;
    const puntosObjetivo = round(circ * (puntos10/10));
    vueltas = Math.max(3, Math.round(puntosObjetivo / inc));

    titulo = `Posavasos circular (${diam} cm)`;
    materiales = [
      `Algodón firme ~${Math.max(20, Math.round(circ*1.2))} m`,
      `Aguja ${(puntos10>=20)?3.5:4} mm`
    ];
    pasos = [
      ...pasosCircular(inicio, vueltas),
      `Remate y bloqueo ligero`
    ];
  }
  else if (tipo === "puntera") {
    const contorno = num(medidas.contorno_cm, 24);
    const ease = medidas.ease ?? -0.08;
    const contornoObjetivo = contorno * (1 + ease);
    const puntosObjetivo = round(contornoObjetivo * ptsPorCm);
    vueltas = Math.max(3, Math.round(puntosObjetivo / inc));

    titulo = `Puntera de calcetín (${Math.round(contorno)} cm)`;
    materiales = [
      `Hilo para calcetines ~${Math.max(50, Math.round(contornoObjetivo*2.5))} m`,
      `Aguja ${(puntos10>=20)?3:3.5} mm`
    ];
    pasos = [
      ...pasosCircular(inicio, vueltas),
      `Pie: continuar recto en pb hasta largo antes del talón`
    ];
  }
  else { // base circular genérica
    const diam = Math.max(6, num(medidas.diametro_cm, 12));
    const circ = Math.PI * diam;
    const puntosObjetivo = round(circ * (puntos10/10));
    vueltas = Math.max(3, Math.round(puntosObjetivo / inc));

    titulo = tituloBase || `Base circular (${diam} cm)`;
    materiales = [
      `Hilo acorde ~${Math.max(30, Math.round(circ))} m`,
      `Aguja según tensión`
    ];
    pasos = [
      ...pasosCircular(inicio, vueltas),
      `Opcional: elevar paredes según proyecto (cesta/amigurumi)`
    ];
  }

  return { titulo, materiales, pasos, vueltas, inicio, r0, dr };
}

function genLinealBase({tipo, tituloBase, puntos10, vueltas10, medidas}){
  const ptsPorCm = puntos10 / 10;
  const vtsPorCm = vueltas10 / 10;
  let titulo = tituloBase || "Proyecto lineal";
  let ancho_cm  = num(medidas.ancho_cm, 22);
  let largo_cm  = num(medidas.largo_cm, 150);

  const ancho_pts = Math.max(8, Math.round(ancho_cm * ptsPorCm));
  const filas = Math.max(10, Math.round(largo_cm * vtsPorCm));

  titulo = (tipo === "bufanda") ? `Bufanda (${ancho_cm}×${largo_cm} cm)` : titulo;
  const materiales = [
    `Hilo acorde a PB (~${Math.round(largo_cm*3)} m aprox.)`,
    `Aguja ${(puntos10>=20)?4:5} mm (ajusta según tensión)`,
    `Tijeras · Aguja lanera`
  ];
  const pasos = [
    `Cadena de inicio: ~${ancho_pts} pts (ancho ${ancho_cm} cm)`,
    `Fila 1: tejer en pb hasta el final`,
    `Filas 2–${filas}: repetir hasta ${largo_cm} cm`,
    `Rematar, bloquear suave y esconder hebras`
  ];
  return { titulo, materiales, pasos, ancho_pts, filas, ancho_cm, largo_cm };
}

/* =============== SVG: cabecera + símbolos =============== */
function svgHeader(W,H){
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#94a3b8" flood-opacity="0.25"/></filter>
</defs>`;
}
function svgFooter(){ return `</svg>`; }

const BROWN = "#5A3D2B"; // marrón oscuro

function drawSymbol(type, x, y, rot=0, size=12, color=BROWN) {
  const sw = Math.max(1.6, size/7.5);
  const len = size;
  let g = `<g transform="translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${rot.toFixed(1)})" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none">`;
  switch (type) {
    case "pr": g += `<circle cx="0" cy="0" r="${size*0.35}" fill="${color}" stroke="none"/>`; break; // punto raso
    case "c":  g += `<ellipse cx="0" cy="0" rx="${size*0.65}" ry="${size*0.36}"/>`; break;        // cadena
    case "pb": // punto bajo: X
      g += `<line x1="${-len*0.5}" y1="${-len*0.5}" x2="${len*0.5}" y2="${len*0.5}"/>`;
      g += `<line x1="${len*0.5}" y1="${-len*0.5}" x2="${-len*0.5}" y2="${len*0.5}"/>`;
      break;
    case "pma":
    case "pa":
    case "pad":
    case "pat": {
      g += `<line x1="0" y1="${-len*0.6}" x2="0" y2="${len*0.6}"/>`;                     // tronco
      g += `<line x1="${-len*0.45}" y1="${-len*0.6}" x2="${len*0.45}" y2="${-len*0.6}"/>`; // cabeza T
      const bars = (type==="pa")?1:(type==="pad")?2:(type==="pat")?3:0;                    // lazadas
      for (let i=0;i<bars;i++){
        const yy = -len*0.18 + i*(len*0.18), dx = len*0.26, dy = len*0.14;
        g += `<line x1="${-dx}" y1="${yy-dy}" x2="${dx}" y2="${yy+dy}"/>`;
      }
      break;
    }
    default: break;
  }
  g += `</g>`;
  return g;
}
function legendCrochet(x, y) {
  const items = [
    {t:"pr", label:"punto raso (pr)"},
    {t:"c",  label:"cadena (c)"},
    {t:"pb", label:"punto bajo (pb)"},
    {t:"pma",label:"punto medio alto (pma)"},
    {t:"pa", label:"punto alto (pa)"},
    {t:"pad",label:"punto alto doble (pad)"},
    {t:"pat",label:"punto alto triple (pat)"}
  ];
  let out = `<g transform="translate(${x},${y})">`;
  out += `<rect width="250" height="${items.length*22+16}" rx="10" fill="#fff" stroke="#e2e8f0" filter="url(#shadow)"/>`;
  items.forEach((it, i)=>{
    const yy = 14 + i*22;
    out += drawSymbol(it.t, 16, yy, 0, 12, BROWN);
    out += `<text x="32" y="${yy+4}" style="font:12px system-ui; fill:#475569">${it.label}</text>`;
  });
  out += `</g>`;
  return out;
}

/* =============== Renderers =============== */
function renderCircularSVG({titulo, vueltas, inicio, r0=40, dr=22, W=900, font=12, guides=true}){
  const Rfinal = r0 + dr*(vueltas-1);
  const H = Math.round(Rfinal*2 + 120);
  const cx = W/2, cy = H/2;
  let out = svgHeader(W,H);
  out += `<rect width="100%" height="100%" fill="#f1f5f9"/>`;
  out += `<text x="${W/2}" y="32" text-anchor="middle" style="font:700 18px system-ui; fill:#0f172a">${titulo} — diagrama circular</text>`;

  // bandas de guía
  for (let v=0; v<vueltas; v++){
    const rMid = r0 + dr*v + dr/2;
    out += `<circle cx="${cx}" cy="${cy}" r="${rMid}" fill="none" stroke="#dbeafe" stroke-width="${dr-3}"/>`;
    out += `<circle cx="${cx}" cy="${cy}" r="${r0 + dr*v}" fill="none" stroke="#bfdbfe" stroke-width="1"/>`;
  }

  // radial guía + numeración
  const ang = -Math.PI/12;
  const x1 = cx + (r0-6)*Math.cos(ang), y1 = cy + (r0-6)*Math.sin(ang);
  const x2 = cx + (r0+dr*(vueltas-1)+dr/2)*Math.cos(ang), y2 = cy + (r0+dr*(vueltas-1)+dr/2)*Math.sin(ang);
  if (guides) out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#94a3b8" stroke-dasharray="4 4"/>`;
  for (let v=1; v<=vueltas; v++){
    const r = r0 + dr*(v-1) + dr/2;
    const x = cx + r*Math.cos(ang), y = cy + r*Math.sin(ang);
    out += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" style="font:700 12px system-ui; fill:#334155">${v}</text>`;
  }

  // símbolos pb y aumentos (2 pb en mismo punto base)
  for (let v=1; v<=vueltas; v++){
    const total = inicio * v;
    const step = 2*Math.PI/total;
    for (let i=0;i<total;i++){
      const a = -Math.PI/2 + step*i;
      const r = r0 + dr*(v-1);
      const x = cx + r*Math.cos(a), y = cy + r*Math.sin(a);
      const rot = a*180/Math.PI + 90;

      const isAum = (v===2) || (v>=3 && (i % (v-1) === (v-2)));
      if (!isAum) {
        out += drawSymbol("pb", x, y, rot, font, BROWN);
      } else {
        const dAng = step*0.18;
        const a1 = a - dAng, a2 = a + dAng;
        const x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
        const x2 = cx + r*Math.cos(a2), y2 = cy + r*Math.sin(a2);
        const rot1 = a1*180/Math.PI + 90, rot2 = a2*180/Math.PI + 90;
        out += drawSymbol("pb", x1, y1, rot1, font, BROWN);
        out += drawSymbol("pb", x2, y2, rot2, font, BROWN);
      }
    }
  }

  // leyenda
  out += legendCrochet(W-270, H - (22*7 + 28));
  out += svgFooter();
  return { svg: out, width: W, height: H };
}

function renderLinealSVG({titulo, filas=40, ancho_pts=60, W=900}){
  // malla de símbolos pb por filas/columnas (MVP)
  const pad = 24, labelW = 56;
  const usableW = Math.max(180, W - pad*2 - labelW);
  const colW = usableW / Math.max(1, ancho_pts);
  const symSize = Math.max(10, Math.min(18, colW*0.8));
  const rowH = symSize + 6;
  const H = Math.round(pad*3 + filas*rowH + 90);
  const startX = pad + labelW, startY = pad*1.8;

  let out = svgHeader(W,H);
  out += `<rect width="100%" height="100%" fill="#f8fafc"/>`;
  out += `<text x="${W/2}" y="${pad}" text-anchor="middle" style="font:700 18px system-ui; fill:#0f172a">${titulo} — esquema lineal</text>`;

  for (let r=0;r<filas;r++){
    const y = startY + r*rowH + rowH*0.55;
    out += `<text x="${pad+6}" y="${y+4}" style="font: 11px system-ui; fill:#64748b">${r+1}</text>`;
    for (let c=0;c<ancho_pts;c++){
      const x = startX + c*colW + colW*0.5;
      out += drawSymbol("pb", x, y, 0, symSize, BROWN);
    }
  }

  out += legendCrochet(W-270, H - (22*7 + 28));
  out += svgFooter();
  return { svg: out, width: W, height: H };
}

/* =============== Handler =============== */
exports.handler = async (event) => {
  try {
    const { categoria, punto, layout, format, puntos10, vueltas10, medidas, q } = parseInput(event);

    // familia por defecto
    let family = layout;
    if (!family) {
      if (["gorro","posavasos","puntera","base","amigurumi","cesta","circular"].includes(categoria)) family = "circular";
      else family = "lineal"; // MVP: lineal → bufanda
    }

    // datos base
    let data = null;
    if (family === "circular") {
      let tipo = "base";
      if (categoria==="gorro") tipo = "gorro";
      else if (categoria==="posavasos") tipo = "posavasos";
      else if (categoria==="puntera") tipo = "puntera";
      data = genCircularBase({ tipo, tituloBase:`Proyecto ${categoria}`, puntos10, vueltas10, medidas });
    } else {
      data = genLinealBase({ tipo:"bufanda", tituloBase:`Proyecto ${categoria}`, puntos10, vueltas10, medidas });
    }

    // SVG directo
    if (format === "svg") {
      if (family === "circular") {
        const W = num(q.w, 900);
        const font = num(q.font, 12);
        const guides = bool(q.guia, true);
        const titulo = q.titulo || data.titulo;
        const vueltas = num(q.vueltas, data.vueltas);
        const inicio  = num(q.inicio, data.inicio);
        const r0 = num(q.r0, data.r0);
        const dr = num(q.dr, data.dr);
        const svg = renderCircularSVG({ titulo, vueltas, inicio, r0, dr, W, font, guides });
        return { statusCode: 200, headers: { "Content-Type":"image/svg+xml; charset=utf-8", "Cache-Control":"no-store", "Access-Control-Allow-Origin":"*" }, body: svg.svg };
      } else {
        const W = num(q.w, 900);
        const filas = num(q.filas, data.filas);
        const ancho_pts = num(q.ancho_pts, data.ancho_pts);
        const titulo = q.titulo || data.titulo;
        const svg = renderLinealSVG({ titulo, filas, ancho_pts, W });
        return { statusCode: 200, headers: { "Content-Type":"image/svg+xml; charset=utf-8", "Cache-Control":"no-store", "Access-Control-Allow-Origin":"*" }, body: svg.svg };
      }
    }

    // JSON (para GPT): texto + link a su propio SVG + PDF opcional
    const baseUrl = "";
    const svgLink = (family === "circular")
      ? `${baseUrl}/.netlify/functions/patron-universal?format=svg&layout=circular&titulo=${enc(data.titulo)}&vueltas=${data.vueltas}&inicio=${data.inicio}&r0=${data.r0}&dr=${data.dr}&w=900`
      : `${baseUrl}/.netlify/functions/patron-universal?format=svg&layout=lineal&titulo=${enc(data.titulo)}&filas=${data.filas}&ancho_pts=${data.ancho_pts}&w=900`;

    const resp = {
      ok: true,
      fecha: new Date().toISOString(),
      patron: {
        titulo: data.titulo,
        nivel: "Principiante",
        tension: `${puntos10} pts × ${vueltas10} v en 10 cm (pb)`,
        materiales: data.materiales || [],
        pasos: data.pasos || [],
        consejos: [
          "Teje muestra 10×10 cm para verificar tensión.",
          "Ajusta tamaño de aguja si aprietas o te queda flojo."
        ],
        variantes: ["Cambios de color", "Borde decorativo"]
      },
      links: {
        svg: svgLink,
        pdf: "/.netlify/functions/generar-pdf"
      },
      input_echo: { categoria, layout:family, punto, puntos10, vueltas10, medidas }
    };

    return {
      statusCode: 200,
      headers: { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "Access-Control-Allow-Origin":"*" },
      body: JSON.stringify(resp)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type":"application/json; charset=utf-8", "Access-Control-Allow-Origin":"*" },
      body: JSON.stringify({ ok:false, error: err.message })
    };
  }
};
