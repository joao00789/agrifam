/**
 * Contratos do domínio do AgriFam.
 * As respostas da API devem seguir estes formatos quando o backend existir.
 */
export interface Category {
  name: string;
  icon: string;
  count: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  producer: string;
  location: string;
  category: string;
  rating: number;
  image: string;
}

export interface Producer {
  id: number;
  name: string;
  property: string;
  location: string;
  specialty: string;
  rating: number;
  history: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type SortOption = "featured" | "price-low" | "rating";

export interface ProductFilters {
  search: string;
  category: string;
  sort: SortOption;
}
