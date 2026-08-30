import { core, JSON_HEADERS, jsonResponse } from "../_lib/load-core.mjs";

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: JSON_HEADERS });
  }
  if (request.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Método não permitido." });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, error: "JSON inválido." });
  }

  try {
    const result = await core.generatePhrase(body);
    return jsonResponse(200, { ok: true, ...result });
  } catch (e) {
    return jsonResponse(500, {
      ok: false,
      error: (e && e.message) ? e.message : "Erro interno.",
    });
  }
}
