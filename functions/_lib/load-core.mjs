import core from "./core-ai.js";

export { core };

export const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export async function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}
