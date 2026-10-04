// Eu explico: Aplica tema e título antes de exibir a página, evitando mudança visual ao carregar.
const page = new URLSearchParams(location.search).get("page") || "inicio";
document.documentElement.dataset.page = [
  "inicio",
  "produtos",
  "produtores",
  "sobre",
].includes(page)
  ? page
  : "inicio";

const pageTitles = {
  inicio: "AgriFam | Do campo para sua mesa",
  produtos: "Produtos | AgriFam",
  produtores: "Produtores | AgriFam",
  sobre: "Sobre a AgriFam",
};
document.title = pageTitles[document.documentElement.dataset.page];

const prefersDark =
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;
try {
  const preference = localStorage.getItem("agrifam-theme") || "system";
  const dark =
    preference === "dark" || (preference === "system" && prefersDark);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
} catch {
  document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
}
