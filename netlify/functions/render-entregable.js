exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify({
      ok: true,
      mensaje: "Hola, soy Hana, tu servidor de crochet 👋"
    })
  };
};
