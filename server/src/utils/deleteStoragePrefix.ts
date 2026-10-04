import { ApiError } from "../middlewares/errorHandler.js";

type StorageEntry = { name?: string; id?: string | null };
const MAX_FILES_PER_ACCOUNT = 2000;

/* Eu explico: * Apaga os arquivos de uma pasta do bucket pela API oficial do Storage. */
export const deleteStoragePrefix = async (prefix: string) => {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "agrifam-images";
  if (!supabaseUrl || !apiKey) throw new ApiError(503, "O Storage precisa estar configurado para excluir os dados da conta.");

  const filePaths: string[] = [];
  const visit = async (folder: string): Promise<void> => {
    let offset = 0;
    while (true) {
      const response = await fetch(`${supabaseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: "POST",
        headers: { apikey: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: folder, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new ApiError(503, "Não foi possível preparar a exclusão segura das imagens da conta.");
      const entries = await response.json() as StorageEntry[];
      if (!Array.isArray(entries)) throw new ApiError(503, "O Storage retornou uma resposta inválida.");
      for (const entry of entries) {
        if (!entry.name || entry.name.includes("..") || entry.name.startsWith("/")) continue;
        const path = `${folder}/${entry.name}`;
        if (entry.id) filePaths.push(path);
        else await visit(path);
        if (filePaths.length > MAX_FILES_PER_ACCOUNT) throw new ApiError(409, "A conta contém muitos arquivos para excluir em uma única operação. Fale com o suporte.");
      }
      if (entries.length < 100) break;
      offset += entries.length;
    }
  };
  await visit(prefix);

  for (let index = 0; index < filePaths.length; index += 500) {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: "DELETE",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: filePaths.slice(index, index + 500) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new ApiError(503, "Não foi possível excluir todas as imagens da conta. Tente novamente.");
  }
};
