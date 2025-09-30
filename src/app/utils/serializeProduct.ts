// utils/serializeProduct.ts
import { ProductCalc } from "@/app/types";

export function serializeForUpdate(product: ProductCalc) {
  return {
    productId: product.productId,
    updates: {
      name: product.name,
      description: product.description,
      remarks: product.remarks,
      sku: product.sku,
      inci: product.customFields?.custom1,
      account: product.customFields?.custom8,

      // if you want to include BOM edits later, keep them here
      itemBoms: product.components?.map((c: any) => ({
        itemBomId: c.itemBomId,
        productId: product.productId,
        childProductId: c.childProductId,
        quantity: {
          standardQuantity: c.quantity.toFixed(4),
          uomQuantity: c.quantity.toFixed(4),
          uom: c.uom || "",
          serialNumbers: [],
        },
      })),
    },
  };
}
