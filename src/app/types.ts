// Shared types

export type Component = {
  name: string;
  quantity: number;
  percent: number;
  uom: string;
  unit_cost: number;
  line_cost: number;
};

export type Product = {
  product_name: string;
  sku?: string;
  barcode?: string;
  components: Component[];
  calculated_cost: number;   // base cost only
  packaging_cost?: number;   // optional packaging cost
  labor_cost?: number;       // optional labor cost
};
