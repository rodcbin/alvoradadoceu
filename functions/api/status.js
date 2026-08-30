import { core, jsonResponse } from "../_lib/load-core.mjs";

export async function onRequest() {
  try {
    const provs = core.configuredProviders();
    return jsonResponse(200, {
      ok: true,
      nome: "Alvorada do Céu",
      categorias: core.CATEGORIAS.length,
      provedores: provs,
    });
  } catch (e) {
    return jsonResponse(500, {
      ok: false,
      error: (e && e.message) ? e.message : "Erro interno.",
    });
  }
}
