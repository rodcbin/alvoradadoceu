/* API serverless Netlify — POST /api/frase
 * Reaproveita o mesmo motor do servidor local (core-ai.js).
 * No Netlify as variáveis CF_ACCOUNT_ID / CF_API_TOKEN vêm do
 * painel (Site configuration > Environment variables). */
import core from "./core-ai.js";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Método não permitido." }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "JSON inválido." }),
    };
  }

  try {
    const result = event.path && event.path.endsWith("/api/legenda")
      ? await core.gerarLegenda(body)
      : await core.generatePhrase(body);
    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: true, ...result }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        ok: false,
        error: e && e.message ? e.message : "Erro interno.",
      }),
    };
  }
}