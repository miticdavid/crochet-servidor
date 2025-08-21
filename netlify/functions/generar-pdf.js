// netlify/functions/generar-pdf.js
const PDFDocument = require("pdfkit");

exports.handler = async (event) => {
  try {
    const method = event.httpMethod || "GET";
    let data = {};
    if (method === "POST") {
      data = JSON.parse(event.body || "{}");
    }

    const titulo = data.titulo || "Patrón de ejemplo";
    const materiales = Array.isArray(data.materiales) ? data.materiales : ["Hilo", "Aguja", "Tijeras"];
    const pasos = Array.isArray(data.pasos) ? data.pasos : ["Paso 1", "Paso 2", "Paso 3"];

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    // Título
    doc.fontSize(20).text(titulo, { align: "center" });
    doc.moveDown();

    // Materiales
    doc.fontSize(14).text("Materiales", { underline: true });
    doc.moveDown(0.5);
    materiales.forEach((m) => doc.fontSize(11).text(`• ${m}`));
    doc.moveDown();

    // Pasos
    doc.fontSize(14).text("Pasos", { underline: true });
    doc.moveDown(0.5);
    pasos.forEach((p, i) => doc.fontSize(11).text(`${i + 1}) ${p}`));

    // Pie
    doc.moveDown();
    doc.fontSize(9).fillColor("#666")
       .text(`Generado por Club IA de Manualidades — ${new Date().toLocaleDateString("es-ES")}`, { align: "right" });

    doc.end();
    const pdfBuffer = await done;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="patron.pdf"`,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
