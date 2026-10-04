import type { CartItem, ProductFilters } from "./types";

/**
 * Eu explico: Ponto de entrada tipado reservado para a migração gradual do frontend.
 *
 * Eu explico: O arquivo script.js é a saída que o navegador usa hoje. Depois de instalar
 * Eu explico: as dependências, `npm run build` compila este arquivo para JavaScript em dist/.
 * Eu explico: A lógica existente pode ser movida para cá por etapas sem quebrar a página.
 */
export const backendIntegration = {
  /* Eu explico: * Substituir por GET /api/produtos quando a API estiver disponível. */
  productsEndpoint: "/api/produtos",
  /* Eu explico: * Substituir por GET /api/produtores quando a API estiver disponível. */
  producersEndpoint: "/api/produtores",
  /* Eu explico: * Substituir por POST /api/pedidos na finalização real da compra. */
  ordersEndpoint: "/api/pedidos",
} as const;

/**
 * Eu explico: Mantém o formato do estado que hoje fica no localStorage.
 * Eu explico: Depois, este estado pode ser sincronizado com a conta autenticada.
 */
export interface FrontendState {
  cart: CartItem[];
  favorites: number[];
  filters: ProductFilters;
}

export const defaultFilters: ProductFilters = {
  search: "",
  category: "",
  sort: "featured",
};
